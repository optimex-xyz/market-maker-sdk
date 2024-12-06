import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

import config from '../../../config/config';
import { InternalTransferParams, ITransferStrategy } from '../transfer-strategy.interface';

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

export class BTCTransferStrategy implements ITransferStrategy {
  private readonly ECPair = ECPairFactory(ecc)
  private readonly privateKey: string

  private readonly networkMap = new Map<string, bitcoin.Network>([
    ['bitcoin-testnet', bitcoin.networks.testnet],
    ['bitcoin', bitcoin.networks.bitcoin],
  ])

  private readonly rpcMap = new Map<string, string>([
    ['bitcoin-testnet', 'https://mempool.space/testnet'],
    ['bitcoin', 'https://mempool.space'],
  ])

  constructor() {
    this.privateKey = config.getBtcPrivateKey()
    bitcoin.initEccLib(ecc)
  }

  async transfer(params: InternalTransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params

    try {
      const network = this.getNetwork(token.networkId)
      const rpcUrl = this.getRpcUrl(token.networkId)

      console.log(`Starting BTC transfer of ${amount} satoshis to ${toAddress}`)

      const txId = await this.sendBTC(
        toAddress,
        amount,
        network,
        rpcUrl,
        tradeId
      )

      console.log(`BTC transfer successful: ${txId}`)
      return txId
    } catch (error) {
      console.error('BTC transfer failed:', error)
      throw error
    }
  }

  private async sendBTC(
    toAddress: string,
    amountSats: bigint,
    network: bitcoin.Network,
    rpcUrl: string,
    tradeId: string
  ): Promise<string> {
    const keyPair = this.ECPair.fromWIF(this.privateKey, network)
    const { payment, keypair } = this.createPayment(keyPair.publicKey, network)

    if (!payment.address) {
      throw new Error('Could not generate address')
    }

    const utxos = await this.getUTXOs(payment.address, rpcUrl)
    if (utxos.length === 0) {
      throw new Error('No UTXOs found')
    }

    // Create and sign transaction
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

    if (totalInput < amountSats) {
      throw new Error(
        `Insufficient balance. Need ${amountSats}, have ${totalInput}`
      )
    }

    // Add outputs
    const feeRate = await this.getFeeRate(rpcUrl)
    const fee = BigInt(Math.ceil(utxos.length * 180 * feeRate))
    const changeAmount = totalInput - amountSats - fee

    // Add recipient output
    psbt.addOutput({
      address: toAddress,
      value: amountSats,
    })

    // Add change output if significant
    if (changeAmount > 546n) {
      psbt.addOutput({
        address: payment.address,
        value: changeAmount,
      })
    }

    // Add OP_RETURN output with trade ID
    psbt.addOutput({
      script: bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        Buffer.from(tradeId),
      ]),
      value: 0n,
    })

    // Sign all inputs
    for (let i = 0; i < psbt.txInputs.length; i++) {
      psbt.signInput(i, keypair)
    }

    psbt.finalizeAllInputs()

    // Broadcast transaction
    const tx = psbt.extractTransaction()
    const response = await axios.post(`${rpcUrl}/api/tx`, tx.toHex(), {
      headers: { 'Content-Type': 'text/plain' },
    })

    return response.data
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

  private async getUTXOs(address: string, rpcUrl: string): Promise<UTXO[]> {
    const response = await axios.get<UTXO[]>(
      `${rpcUrl}/api/address/${address}/utxo`
    )
    return response.data
  }

  private async getFeeRate(rpcUrl: string): Promise<number> {
    try {
      const response = await axios.get<{ [key: string]: number }>(
        `${rpcUrl}/api/fee-estimates`
      )
      const smallestValue = Math.min(...Object.values(response.data))
      return smallestValue * 1.25
    } catch (error) {
      return 1.54
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
