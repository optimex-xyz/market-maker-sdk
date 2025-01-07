import { Job, Queue } from 'bull'
import { ethers } from 'ethers'

import { stringToHex, toObject, toString } from '@bitfi-mock-pmm/shared'
import { ensureHexPrefix, ITypes, routerService, tokenService } from '@bitfixyz/market-maker-sdk'
import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { SETTLEMENT_QUEUE } from '../const'
import { TransferFactory } from '../factories'
import { SubmitSettlementEvent, TransferSettlementEvent } from '../types'
import { decodeAddress } from '../utils'

@Processor(SETTLEMENT_QUEUE.TRANSFER.NAME)
export class TransferSettlementProcessor {
  private pmmId: string

  private tokenService = tokenService
  private routerService = routerService
  private tokenRepo = tokenService

  private readonly logger = new Logger(TransferSettlementProcessor.name)

  constructor(
    private configService: ConfigService,
    private transferFactory: TransferFactory,
    @InjectQueue(SETTLEMENT_QUEUE.SUBMIT.NAME)
    private submitSettlementQueue: Queue
  ) {
    this.pmmId = stringToHex(this.configService.getOrThrow<string>('PMM_ID'))
  }

  @Process(SETTLEMENT_QUEUE.TRANSFER.JOBS.PROCESS)
  async transfer(job: Job<string>) {
    const { tradeId } = toObject(job.data) as TransferSettlementEvent

    try {
      const pMMSelection = await this.routerService.getPMMSelection(tradeId)

      const { pmmInfo } = pMMSelection

      if (pmmInfo.selectedPMMId !== this.pmmId) {
        this.logger.error(`Tradeid ${tradeId} is not belong this pmm`)
        return
      }

      const trade: ITypes.TradeDataStructOutput = await this.routerService.getTradeData(tradeId)

      const paymentTxId = await this.transferToken(pmmInfo, trade, tradeId)

      const eventData = {
        tradeId: tradeId,
        paymentTxId,
      } as SubmitSettlementEvent

      await this.submitSettlementQueue.add(SETTLEMENT_QUEUE.SUBMIT.JOBS.PROCESS, toString(eventData))

      this.logger.log(`Processing transfer tradeId ${tradeId} success with paymentId ${paymentTxId}`)
    } catch (error) {
      this.logger.error(`Processing transfer tradeId ${tradeId} failed: ${error}`)
    }
  }

  private async transferToken(
    pmmInfo: { amountOut: bigint },
    trade: ITypes.TradeDataStructOutput,
    tradeId: string
  ): Promise<string> {
    const amount = pmmInfo.amountOut
    const {
      address: toUserAddress,
      networkId,
      tokenAddress: toTokenAddress,
    } = await this.decodeChainInfo(trade.tradeInfo.toChain)

    this.logger.log(`
      Decoded chain info:
      - To Address: ${toUserAddress}
      - Chain: ${networkId}
      - Token: ${toTokenAddress}
    `)

    const toToken = await this.tokenRepo.getToken(networkId, toTokenAddress)

    try {
      const strategy = this.transferFactory.getStrategy(toToken.networkType)
      const tx = await strategy.transfer({
        toAddress: toUserAddress,
        amount,
        token: toToken,
        tradeId,
      })

      return ensureHexPrefix(tx)
    } catch (error) {
      this.logger.error('Transfer token error:', error)
      throw error
    }
  }

  private async decodeChainInfo(chainInfo: [string, string, string]): Promise<{
    address: string
    networkId: string
    tokenAddress: string
  }> {
    const [addressHex, networkIdHex, tokenAddressHex] = chainInfo

    const networkId = ethers.toUtf8String(networkIdHex)
    const tokenAddress = ethers.toUtf8String(tokenAddressHex)

    const token = await this.tokenService.getToken(networkId, tokenAddress)

    return {
      address: decodeAddress(addressHex, token),
      networkId,
      tokenAddress,
    }
  }
}
