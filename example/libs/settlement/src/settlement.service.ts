import { Queue } from 'bull'
import * as ethers from 'ethers'

import { stringToHex, toString } from '@bitfi-mock-pmm/shared'
import { TradeService } from '@bitfi-mock-pmm/trade'
import {
  getCommitInfoHash,
  getSignature,
  routerService,
  SignatureType,
  signerService,
} from '@bitfixyz/market-maker-sdk'
import { InjectQueue } from '@nestjs/bull'
import { BadRequestException, HttpException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Trade, TradeStatus } from '@prisma/client'

import { SETTLEMENT_QUEUE } from './const'
import {
  AckSettlementDto,
  AckSettlementResponseDto,
  GetSettlementSignatureDto,
  SettlementSignatureResponseDto,
  SignalPaymentDto,
  SignalPaymentResponseDto,
  SubmitTxDTO,
} from './settlement.dto'
import { SubmitSettlementEvent, TransferSettlementEvent } from './types'

@Injectable()
export class SettlementService {
  private readonly pmmWallet: ethers.Wallet
  private provider: ethers.JsonRpcProvider
  private pmmId: string

  private routerService = routerService

  constructor(
    private readonly configService: ConfigService,
    private readonly tradeService: TradeService,
    @InjectQueue(SETTLEMENT_QUEUE.TRANSFER.NAME)
    private transferSettlementQueue: Queue,
    @InjectQueue(SETTLEMENT_QUEUE.SUBMIT.NAME)
    private submitSettlementQueue: Queue
  ) {
    const rpcUrl = this.configService.getOrThrow<string>('RPC_URL')
    const pmmPrivateKey = this.configService.getOrThrow<string>('PMM_PRIVATE_KEY')

    this.pmmId = stringToHex(this.configService.getOrThrow<string>('PMM_ID'))

    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.pmmWallet = new ethers.Wallet(pmmPrivateKey, this.provider)
  }

  async getSettlementSignature(dto: GetSettlementSignatureDto, trade: Trade): Promise<SettlementSignatureResponseDto> {
    try {
      const { tradeId } = trade

      const [presigns, tradeData] = await Promise.all([
        this.routerService.getPresigns(tradeId),
        this.routerService.getTradeData(tradeId),
      ])

      const { toChain } = tradeData.tradeInfo
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800)

      const pmmPresign = presigns.find((t) => t.pmmId === this.pmmId)
      if (!pmmPresign) {
        throw new BadRequestException('pmmPresign not found')
      }

      const amountOut = BigInt(dto.committedQuote) - BigInt(dto.solverFee)

      const commitInfoHash = getCommitInfoHash(
        pmmPresign.pmmId,
        pmmPresign.pmmRecvAddress,
        toChain[1],
        toChain[2],
        amountOut,
        deadline
      )

      const signerAddress = await this.routerService.getSigner()

      const domainData = await signerService.getDomain(signerAddress)
      const domain = {
        name: domainData.name,
        version: domainData.version,
        chainId: domainData.chainId,
        verifyingContract: domainData.verifyingContract,
      }

      const signature = await getSignature(
        this.pmmWallet,
        this.provider,
        signerAddress,
        tradeId,
        commitInfoHash,
        SignatureType.VerifyingContract,
        domain
      )

      await this.tradeService.updateTradeStatus(tradeId, TradeStatus.COMMITTED)

      return {
        tradeId: tradeId,
        signature,
        deadline: Number(deadline),
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }

  async ackSettlement(dto: AckSettlementDto, trade: Trade): Promise<AckSettlementResponseDto> {
    try {
      if (trade.status !== TradeStatus.SETTLING) {
        throw new BadRequestException(`Invalid trade status: ${trade.status}`)
      }

      // Update trade status based on chosen status
      const newStatus = dto.chosen === 'true' ? TradeStatus.SETTLING : TradeStatus.FAILED

      await this.tradeService.updateTradeStatus(
        dto.tradeId,
        newStatus,
        dto.chosen === 'false' ? 'PMM not chosen for settlement' : undefined
      )

      return {
        tradeId: dto.tradeId,
        status: 'acknowledged',
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }

  async signalPayment(dto: SignalPaymentDto, trade: Trade): Promise<SignalPaymentResponseDto> {
    try {
      if (trade.status !== TradeStatus.COMMITTED) {
        throw new BadRequestException(`Invalid trade status: ${trade.status}`)
      }

      const eventData = {
        tradeId: dto.tradeId,
      } as TransferSettlementEvent

      await this.transferSettlementQueue.add(SETTLEMENT_QUEUE.TRANSFER.JOBS.PROCESS, toString(eventData))

      // You might want to store the protocol fee amount or handle it in your business logic
      await this.tradeService.updateTradeStatus(dto.tradeId, TradeStatus.SETTLING)

      return {
        tradeId: dto.tradeId,
        status: 'acknowledged',
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }

  async submitTx(dto: SubmitTxDTO) {
    try {
      const eventData = {
        tradeId: dto.tradeId,
        paymentTxId: dto.paymentTxId,
      } as SubmitSettlementEvent

      await this.transferSettlementQueue.add(SETTLEMENT_QUEUE.TRANSFER.JOBS.PROCESS, toString(eventData))

      return {
        tradeId: dto.tradeId,
        status: 'enqueue ok',
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }
}
