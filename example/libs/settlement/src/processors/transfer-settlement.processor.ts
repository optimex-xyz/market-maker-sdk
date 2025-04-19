import { stringToHex, toObject, toString } from '@bitfi-mock-pmm/shared'
import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ITypes, routerService, tokenService } from '@optimex-xyz/market-maker-sdk'

import { Job, Queue } from 'bull'

import { SETTLEMENT_QUEUE } from '../const'
import { TransferFactory } from '../factories'
import { SubmitSettlementEvent, TransferSettlementEvent } from '../types'
import { l2Decode } from '../utils'

@Processor(SETTLEMENT_QUEUE.TRANSFER.NAME)
export class TransferSettlementProcessor {
  private pmmId: string
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 30000

  private routerService = routerService
  private tokenRepo = tokenService

  private readonly logger = new Logger(TransferSettlementProcessor.name)

  constructor(
    private configService: ConfigService,
    private transferFactory: TransferFactory,
    @InjectQueue(SETTLEMENT_QUEUE.SUBMIT.NAME) private submitSettlementQueue: Queue,
    @InjectQueue(SETTLEMENT_QUEUE.TRANSFER.NAME) private transferSettlementQueue: Queue
  ) {
    this.pmmId = stringToHex(this.configService.getOrThrow<string>('PMM_ID'))
  }

  @Process(SETTLEMENT_QUEUE.TRANSFER.JOBS.PROCESS)
  async transfer(job: Job<string>) {
    const { tradeId, retryCount = 0 } = toObject(job.data) as TransferSettlementEvent & { retryCount?: number }

    this.logger.log(`Processing retry ${retryCount}/${this.MAX_RETRIES} for tradeId ${tradeId}`)

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

      await this.submitSettlementQueue.add(SETTLEMENT_QUEUE.SUBMIT.JOBS.PROCESS, toString(eventData), {
        removeOnComplete: {
          age: 24 * 3600,
        },
        removeOnFail: {
          age: 24 * 3600,
        },
      })

      this.logger.log(`Processing transfer tradeId ${tradeId} success with paymentId ${paymentTxId}`)
    } catch (error) {
      if (retryCount < this.MAX_RETRIES - 1) {
        this.logger.warn(`Retry ${retryCount + 1}/${this.MAX_RETRIES} for tradeId ${tradeId}: ${error}`)

        await this.transferSettlementQueue.add(
          SETTLEMENT_QUEUE.TRANSFER.JOBS.PROCESS,
          toString({ tradeId, retryCount: retryCount + 1 }),
          {
            delay: this.RETRY_DELAY,
            removeOnComplete: {
              age: 24 * 3600,
            },
            removeOnFail: {
              age: 24 * 3600,
            },
          }
        )
        return
      }
      this.logger.error(`Processing transfer tradeId ${tradeId} failed after ${this.MAX_RETRIES} attempts: ${error}`)

      throw error
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
      const strategy = this.transferFactory.getStrategy(toToken.networkType.toUpperCase())
      const tx = await strategy.transfer({
        toAddress: toUserAddress,
        amount,
        token: toToken,
        tradeId,
      })

      return tx
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

    return {
      address: l2Decode(addressHex),
      networkId: l2Decode(networkIdHex),
      tokenAddress: l2Decode(tokenAddressHex),
    }
  }
}
