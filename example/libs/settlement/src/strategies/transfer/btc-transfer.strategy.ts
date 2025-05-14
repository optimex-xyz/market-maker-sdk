import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BTC, BTC_TESTNET } from '@optimex-pmm/shared'
import { getTradeIdsHash, Token } from '@optimex-xyz/market-maker-sdk'

import axios from 'axios'
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'

import { ITransferStrategy, TransferParams } from '../../interfaces'
import { TelegramHelper } from '../../utils'

const BLOCKSTREAM_MAINNET_API = 'https://blockstream.info/api'
const BLOCKSTREAM_TESTNET_API = 'https://blockstream.info/testnet/api'
const MEMPOOL_MAINNET_API = 'https://mempool.space/api'
const MEMPOOL_TESTNET_API = 'https://mempool.space/testnet/api'

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
  private readonly btcAddress: string
  private readonly ECPair = ECPairFactory(ecc)
  private maxFeeRate: number
  private readonly TIMEOUT = 15000 // 15 seconds

  private readonly networkMap = new Map<string, bitcoin.Network>([
    [BTC_TESTNET, bitcoin.networks.testnet],
    [BTC, bitcoin.networks.bitcoin],
  ])

  private readonly blockstreamApiMap = new Map<bitcoin.Network, string>([
    [bitcoin.networks.bitcoin, BLOCKSTREAM_MAINNET_API],
    [bitcoin.networks.testnet, BLOCKSTREAM_TESTNET_API],
  ])

  private readonly mempoolApiMap = new Map<bitcoin.Network, string>([
    [bitcoin.networks.bitcoin, MEMPOOL_MAINNET_API],
    [bitcoin.networks.testnet, MEMPOOL_TESTNET_API],
  ])

  constructor(
    private configService: ConfigService,
    private readonly telegramHelper: TelegramHelper
  ) {
    this.maxFeeRate = this.configService.getOrThrow<number>('PMM_BTC_MAX_FEE_RATE', 5)
    this.privateKey = this.configService.getOrThrow<string>('PMM_BTC_PRIVATE_KEY')
    this.btcAddress = this.configService.getOrThrow<string>('PMM_BTC_ADDRESS')
    bitcoin.initEccLib(ecc)
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params

    try {
      this.logger.log(`Starting transfer of ${amount} satoshis to ${toAddress} on ${token.networkName}`)

      // Check balance before proceeding
      const hasSufficientBalance = await this.checkBalance(amount, token.networkId)
      if (!hasSufficientBalance) {
        throw new Error('Insufficient balance for transfer')
      }

      const txId = await this.sendBTC(this.privateKey, toAddress, amount, token.networkId, token, [tradeId])

      this.logger.log(`Transfer successful with txId: ${txId}`)

      return txId
    } catch (error) {
      this.logger.error(error, 'BTC transfer failed:')
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

  private calculateTxSize(inputCount: number, outputCount: number): number {
    const baseTxSize = 10 // version, locktime, etc.
    const inputSize = 107 // outpoint (41) + sequence (1) + witness (65)
    const p2trOutputSize = 42 // value (8) + script (34)
    const opReturnOutputSize = 41 // value (8) + OP_RETURN (1) + data (32)

    return baseTxSize + inputSize * inputCount + p2trOutputSize * outputCount + opReturnOutputSize
  }

  private async sendBTC(
    privateKey: string,
    toAddress: string,
    amountInSatoshis: bigint,
    networkId: string,
    token: Token,
    tradeIds: string[]
  ): Promise<string> {
    const network = this.getNetwork(networkId)

    const keyPair = this.ECPair.fromWIF(privateKey, network)
    const { payment, keypair } = this.createPayment(keyPair.publicKey, network)

    if (!payment.address) {
      throw new Error('Could not generate address')
    }

    this.logger.log(`Sender address: ${this.btcAddress} (${token.networkSymbol})`)

    const utxos = await this.getUTXOs(this.btcAddress, networkId)
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

    const feeRate = await this.getFeeRate(networkId)
    this.logger.log(`Fee rate: ${feeRate}`)

    const txSize = this.calculateTxSize(utxos.length, amountInSatoshis > 546n ? 2 : 1)
    const fee = BigInt(Math.ceil(txSize * feeRate))
    const changeAmount = totalInput - amountInSatoshis - fee

    this.logger.log(`txSize: ${txSize.toString()} satoshis`)
    this.logger.log(`Network fee: ${fee.toString()} satoshis`)
    this.logger.log(`Amount to send: ${amountInSatoshis.toString()} satoshis`)
    this.logger.log(`Change amount: ${changeAmount.toString()} satoshis`)

    psbt.addOutput({
      address: toAddress,
      value: amountInSatoshis,
    })

    if (changeAmount > 546n) {
      psbt.addOutput({
        address: this.btcAddress,
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

    return this.broadcastTransaction(networkId, rawTx)
  }

  private getApiUrls(network: bitcoin.Network): { blockstream: string; mempool: string } {
    return {
      blockstream: this.blockstreamApiMap.get(network) || BLOCKSTREAM_MAINNET_API,
      mempool: this.mempoolApiMap.get(network) || MEMPOOL_MAINNET_API,
    }
  }

  private async withTimeout<T>(promise: Promise<T>, errorMessage: string): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: ${errorMessage}`))
      }, this.TIMEOUT)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private async getUTXOs(address: string, networkId: string): Promise<UTXO[]> {
    const network = this.getNetwork(networkId)
    const { blockstream, mempool } = this.getApiUrls(network)

    const getUTXOsFromBlockstream = async (): Promise<UTXO[]> => {
      const response = await this.withTimeout(
        axios.get<UTXO[]>(`${blockstream}/address/${address}/utxo`),
        'Blockstream UTXO fetch timeout'
      )
      this.logger.log('Successfully fetched UTXOs from Blockstream')
      return response.data
    }

    const getUTXOsFromMempool = async (): Promise<UTXO[]> => {
      const response = await this.withTimeout(
        axios.get<UTXO[]>(`${mempool}/address/${address}/utxo`),
        'Mempool UTXO fetch timeout'
      )
      this.logger.log('Successfully fetched UTXOs from Mempool')
      return response.data
    }

    const maxRetries = 3
    const sleepTime = 5000

    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      try {
        this.logger.log(`Attempting to fetch UTXOs (Attempt ${retryCount}/${maxRetries})`)

        return await Promise.any([getUTXOsFromMempool(), getUTXOsFromBlockstream()])
      } catch (error) {
        this.logger.error(error, `Error fetching UTXOs (Attempt ${retryCount}/${maxRetries}):`)

        if (retryCount === maxRetries) {
          throw new Error('Failed to fetch UTXOs from both services')
        }

        this.logger.log(`Retrying in ${sleepTime / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, sleepTime))
      }
    }

    throw new Error('Failed to fetch UTXOs after max retries')
  }

  private async getFeeRate(networkId: string): Promise<number> {
    const network = this.getNetwork(networkId)
    const { blockstream, mempool } = this.getApiUrls(network)

    const getLowestFeeRate = (feeEstimates: { [key: string]: number }): number => {
      const blockTargets = Object.keys(feeEstimates)
        .map(Number)
        .filter((target) => !isNaN(target))
        .sort((a, b) => a - b)

      if (blockTargets.length === 0) {
        return this.maxFeeRate
      }

      const lowestTarget = blockTargets[0]
      return feeEstimates[lowestTarget] * 1.125
    }

    const getFeeFromMempool = async (): Promise<number> => {
      const response = await this.withTimeout(
        axios.get<{ [key: string]: number }>(`${mempool}/fee-estimates`),
        'Mempool fee rate fetch timeout'
      )
      this.logger.log('Successfully fetched fee rate from Mempool')
      return getLowestFeeRate(response.data)
    }

    const getFeeFromBlockstream = async (): Promise<number> => {
      const response = await this.withTimeout(
        axios.get<{ [key: string]: number }>(`${blockstream}/fee-estimates`),
        'Blockstream fee rate fetch timeout'
      )
      this.logger.log('Successfully fetched fee rate from Blockstream')
      return getLowestFeeRate(response.data)
    }

    const maxRetries = 3
    const sleepTime = 5000

    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      try {
        this.logger.log(`Attempting to fetch fee rate (Attempt ${retryCount}/${maxRetries})`)

        const feeRate = await Promise.any([getFeeFromMempool(), getFeeFromBlockstream()])

        return Math.min(feeRate, this.maxFeeRate)
      } catch (error) {
        this.logger.error(error, `Error fetching fee rate (Attempt ${retryCount}/${maxRetries}):`)

        if (retryCount === maxRetries) {
          this.logger.warn('Max retries reached, using maxFeeRate as fallback')
          return this.maxFeeRate
        }

        this.logger.log(`Retrying in ${sleepTime / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, sleepTime))
      }
    }

    return this.maxFeeRate
  }

  private getNetwork(networkId: string): bitcoin.Network {
    const network = this.networkMap.get(networkId)
    if (!network) {
      throw new Error(`Unsupported network: ${networkId}`)
    }
    return network
  }

  private async broadcastTransaction(networkId: string, rawTx: string): Promise<string> {
    const network = this.getNetwork(networkId)
    const { blockstream, mempool } = this.getApiUrls(network)

    const broadcastToMempool = async (): Promise<string> => {
      const response = await this.withTimeout(
        axios.post(`${mempool}/tx`, rawTx, {
          headers: {
            'Content-Type': 'text/plain',
          },
        }),
        'Mempool transaction broadcast timeout'
      )
      this.logger.log('Successfully broadcasted transaction through Mempool')
      return response.data
    }

    const broadcastToBlockstream = async (): Promise<string> => {
      const response = await this.withTimeout(
        axios.post(`${blockstream}/tx`, rawTx, {
          headers: {
            'Content-Type': 'text/plain',
          },
        }),
        'Blockstream transaction broadcast timeout'
      )
      this.logger.log('Successfully broadcasted transaction through Blockstream')
      return response.data
    }

    try {
      return await Promise.any([broadcastToMempool(), broadcastToBlockstream()])
    } catch (error) {
      throw new Error('Failed to broadcast transaction through both services')
    }
  }

  private async checkBalance(amount: bigint, networkId: string): Promise<boolean> {
    const maxRetries = 3
    const sleepTime = 5000

    const network = this.getNetwork(networkId)
    const { blockstream, mempool } = this.getApiUrls(network)

    const getBalanceFromBlockstream = async (): Promise<bigint> => {
      const response = await this.withTimeout(
        axios.get(`${blockstream}/address/${this.btcAddress}/utxo`),
        'Blockstream balance fetch timeout'
      )
      this.logger.log('Successfully fetched balance from Blockstream')
      if (response?.data) {
        return response.data.reduce((sum: bigint, utxo: any) => sum + BigInt(utxo.value), 0n)
      }
      return 0n
    }

    const getBalanceFromMempool = async (): Promise<bigint> => {
      const response = await this.withTimeout(
        axios.get(`${mempool}/address/${this.btcAddress}/utxo`),
        'Mempool balance fetch timeout'
      )
      this.logger.log('Successfully fetched balance from Mempool')
      if (response?.data) {
        return response.data.reduce((sum: bigint, utxo: any) => sum + BigInt(utxo.value), 0n)
      }
      return 0n
    }

    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      try {
        this.logger.log(`Attempting to check BTC balance (Attempt ${retryCount}/${maxRetries})`)

        const balance = await Promise.any([getBalanceFromMempool(), getBalanceFromBlockstream()])

        if (balance < amount) {
          const message = `⚠️ Insufficient BTC Balance Alert\n\nRequired: ${amount.toString()} satoshis\nAvailable: ${balance.toString()} satoshis\nAddress: ${this.btcAddress}`
          await this.telegramHelper.sendMessage(message)
          return false
        }
        return true
      } catch (error) {
        this.logger.error(error, `Error checking balance (Attempt ${retryCount}/${maxRetries}):`)

        if (retryCount === maxRetries) {
          this.logger.error('Max retries reached for BTC balance check')
          return false
        }

        this.logger.log(`Retrying in ${sleepTime / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, sleepTime))
      }
    }
    return false
  }
}
