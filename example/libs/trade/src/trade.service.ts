import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@optimex-pmm/database'
import { Trade, TradeStatus } from '@prisma/client'

import { CreateTradeDto, UpdateSettlementDto, UpdateTradeQuoteDto } from './trade.dto'

@Injectable()
export class TradeService {
  constructor(private db: DatabaseService) {}

  async createTrade(data: CreateTradeDto): Promise<Trade> {
    const createData = {
      tradeId: data.tradeId,
      fromTokenId: data.fromTokenId,
      fromNetworkId: data.fromNetworkId,
      toTokenId: data.toTokenId,
      toNetworkId: data.toNetworkId,
      fromUser: data.fromUser,
      toUser: data.toUser,
      amount: data.amount,
      status: TradeStatus.PENDING,
      userDepositTx: data.userDepositTx,
      userDepositVault: data.userDepositVault,
      tradeDeadline: data.tradeDeadline,
      scriptDeadline: data.scriptDeadline,
    }

    return this.db.trade.create({
      data: createData,
    })
  }

  async deleteTrade(tradeId: string): Promise<void> {
    await this.db.trade.deleteMany({
      where: { tradeId },
    })
  }

  async findTradeById(tradeId: string): Promise<Trade | null> {
    return this.db.trade.findUnique({
      where: { tradeId },
    })
  }

  async updateTradeQuote(tradeId: string, data: UpdateTradeQuoteDto): Promise<Trade> {
    return this.db.trade.update({
      where: { tradeId },
      data: {
        ...data,
        status: TradeStatus.QUOTE_PROVIDED,
      },
    })
  }

  async updateTradeStatus(tradeId: string, status: TradeStatus, error?: string): Promise<Trade> {
    return this.db.trade.update({
      where: { tradeId },
      data: {
        status,
        ...(error && { error }),
      },
    })
  }

  async updateSettlement(tradeId: string, data: UpdateSettlementDto): Promise<Trade> {
    return this.db.trade.update({
      where: { tradeId },
      data: {
        ...data,
        status: TradeStatus.COMPLETED,
      },
    })
  }

  async getTradesByStatus(status: TradeStatus): Promise<Trade[]> {
    return this.db.trade.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getActiveTrades(): Promise<Trade[]> {
    return this.db.trade.findMany({
      where: {
        status: {
          in: [TradeStatus.PENDING, TradeStatus.QUOTE_PROVIDED, TradeStatus.COMMITTED, TradeStatus.SETTLING],
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async countTradesByStatus(status: TradeStatus): Promise<number> {
    return this.db.trade.count({
      where: { status },
    })
  }

  async failTrade(tradeId: string, error: string): Promise<Trade> {
    return this.db.trade.update({
      where: { tradeId },
      data: {
        status: TradeStatus.FAILED,
        error,
      },
    })
  }

  async transitionToSettling(tradeId: string): Promise<Trade> {
    return this.db.trade.update({
      where: { tradeId },
      data: {
        status: TradeStatus.SETTLING,
      },
    })
  }

  async failStuckTrades(timeoutMinutes: number): Promise<number> {
    const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000)

    const { count } = await this.db.trade.updateMany({
      where: {
        status: {
          in: [TradeStatus.PENDING, TradeStatus.SETTLING],
        },
        updatedAt: {
          lt: timeoutThreshold,
        },
      },
      data: {
        status: TradeStatus.FAILED,
        error: `Trade timed out after ${timeoutMinutes} minutes`,
      },
    })

    return count
  }
}
