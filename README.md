import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'

import { getTradeIdsHash, Token } from '@petafixyz/market-maker-sdk'

import { ITransferStrategy, TransferParams } from '../interfaces/transfer-strategy.interface'

interface UTXO {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
}

@Injectable()
export class BTCTransferStrategy implements ITransferStrategy {
  private readonly privateKey: string
  private readonly ECPair = ECPairFactory(ecc)

  private readonly networkMap = new Map<string, bitcoin.Network>([
    ['bitcoin-testnet', bitcoin.networks.testnet],
    ['bitcoin', bitcoin.networks.bitcoin],
  ])

  private readonly rpcMap = new Map<string, string>([
    ['bitcoin-testnet', 'https://blockstream.info/testnet'],
    ['bitcoin', 'https://blockstream.info'],
  ])

  constructor(private configService: ConfigService) {
    this.privateKey = this.configService.getOrThrow<string>('PMM_BTC_PRIVATE_KEY')
    bitcoin.initEccLib(ecc)
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params

    const network = this.getNetwork(token.networkId)
    const rpcUrl = this.getRpcUrl(token.networkId)

    const txId = await this.sendBTC(this.privateKey, toAddress, amount, network, rpcUrl, token, [tradeId])

    return ensureHexPrefix(txId)
  }

  private createPayment(publicKey: Uint8Array, network: bitcoin.Network) {
    const p2tr = bitcoin.payments.p2tr({
      internalPubkey: Buffer.from(publicKey.slice(1, 33)),
      network,
    })

    return {
      payment: p2tr,
      keypair: this.ECPair.fromWIF(this.privateKey, network),
    }
  }

  private async sendBTC(
    privateKey: string,
    toAddress: string,
    amountInSatoshis: bigint,
    network: bitcoin.Network,
    rpcUrl: string,
    token: Token,
    tradeIds: string[]
  ): Promise<string> {
    const keyPair = this.ECPair.fromWIF(privateKey, network)
    const { payment, keypair } = this.createPayment(keyPair.publicKey, network)

    if (!payment.address) {
      throw new Error('Could not generate address')
    }

    const utxos = await this.getUTXOs(payment.address, rpcUrl)
    if (utxos.length === 0) {
      throw new Error(`No UTXOs found in ${token.networkSymbol} wallet`)
    }

    const psbt = new bitcoin.Psbt({ network })
    let totalInput = 0n

    for (const utxo of utxos) {
      if (!payment.output) {
        throw new Error('Could not generate output script')
      }

      const internalKey = Buffer.from(keypair.publicKey.slice(1, 33))

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: payment.output,
          value: BigInt(utxo.value),
        },
        tapInternalKey: internalKey,
      })

      totalInput += BigInt(utxo.value)
    }

    this.logger.log(`Total input: ${totalInput.toString()} ${token.tokenSymbol}`)

    if (totalInput < amountInSatoshis) {
      throw new Error(
        `Insufficient balance in ${token.networkSymbol} wallet. ` +
          `Need ${amountInSatoshis} satoshis, but only have ${totalInput} satoshis`
      )
    }

    const feeRate = await this.getFeeRate(rpcUrl)
    const fee = BigInt(Math.ceil(200 * feeRate))
    const changeAmount = totalInput - amountInSatoshis - fee

    psbt.addOutput({
      address: toAddress,
      value: amountInSatoshis,
    })

    if (changeAmount > 546n) {
      psbt.addOutput({
        address: payment.address,
        value: changeAmount,
      })
    }

    const tradeIdsHash = getTradeIdsHash(tradeIds)

    // Add OP_RETURN output with tradeIds hash
    psbt.addOutput({
      script: bitcoin.script.compile([bitcoin.opcodes['OP_RETURN'], Buffer.from(tradeIdsHash.slice(2), 'hex')]),
      value: 0n,
    })

    const toXOnly = (pubKey: Uint8Array) => (pubKey.length === 32 ? pubKey : pubKey.slice(1, 33))
    const tweakedSigner = keyPair.tweak(bitcoin.crypto.taggedHash('TapTweak', toXOnly(keyPair.publicKey)))

    for (let i = 0; i < psbt.data.inputs.length; i++) {
      psbt.signInput(i, tweakedSigner, [bitcoin.Transaction.SIGHASH_DEFAULT])
      this.logger.log(`Input ${i} signed successfully`)
    }

    psbt.finalizeAllInputs()

    const tx = psbt.extractTransaction()
    const rawTx = tx.toHex()

    const response = await axios.post(`${rpcUrl}/api/tx`, rawTx, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    return response.data
  }

  private async getUTXOs(address: string, rpcUrl: string): Promise<UTXO[]> {
    const response = await axios.get<UTXO[]>(`${rpcUrl}/api/address/${address}/utxo`)
    return response.data
  }

  private async getFeeRate(rpcUrl: string): Promise<number> {
    try {
      const response = await axios.get<{ [key: string]: number }>(`${rpcUrl}/api/fee-estimates`)
      return response.data[0]
    } catch (error) {
      console.error(`Error fetching
