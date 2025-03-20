import { BTC, BTC_TESTNET } from '@bitfi-mock-pmm/shared'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getTradeIdsHash, Token } from '@optimex-xyz/market-maker-sdk'

import axios from 'axios'
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'

import { ITransferStrategy, TransferParams } from '../../interfaces/transfer-strategy.interface'

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
  private readonly logger = new Logger(BTCTransferStrategy.name)
  private readonly privateKey: string
  private readonly ECPair = ECPairFactory(ecc)

  private readonly networkMap = new Map<string, bitcoin.Network>([
    [BTC_TESTNET, bitcoin.networks.testnet],
    [BTC, bitcoin.networks.bitcoin],
  ])

  private readonly rpcMap = new Map<string, string>([
    [BTC_TESTNET, 'https://blockstream.info/testnet'],
    [BTC, 'https://blockstream.info'],
  ])

  constructor(private configService: ConfigService) {
    this.privateKey = this.configService.getOrThrow<string>('PMM_BTC_PRIVATE_KEY')
    bitcoin.initEccLib(ecc)
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params

    try {
      const network = this.getNetwork(token.networkId)
      const rpcUrl = this.getRpcUrl(token.networkId)

      this.logger.log(`Starting transfer of ${amount} satoshis to ${toAddress} on ${token.networkName}`)

      const txId = await this.sendBTC(this.privateKey, toAddress, amount, network, rpcUrl, token, [tradeId])

      this.logger.log(`Transfer successful with txId: ${txId}`)

      return txId
    } catch (error) {
      this.logger.error('BTC transfer failed:', error)
      throw error
    }
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

    this.logger.log(`Sender address: ${payment.address} (${token.networkSymbol})`)

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

    this.logger.log(`Network fee: ${fee.toString()} satoshis`)
    this.logger.log(`Amount to send: ${amountInSatoshis.toString()} satoshis`)
    this.logger.log(`Change amount: ${changeAmount.toString()} satoshis`)

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
    this.logger.log('All inputs finalized')

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
      return response.data[3]
    } catch (error) {
      console.error(`Error fetching fee rate from ${rpcUrl}:`, error)

      return 1
    }
  }

  private getNetwork(networkId: string): bitcoin.Network {
    const network = this.networkMap.get(networkId)
    if (!network) {
      throw new Error(`Unsupported network: ${networkId}`)
    }
    return network
  }

  private getRpcUrl(networkId: string): string {
    const rpcUrl = this.rpcMap.get(networkId)
    if (!rpcUrl) {
      throw new Error(`Unsupported network: ${networkId}`)
    }
    return rpcUrl
  }
}
