import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { TradeStatus } from '@prisma/client'

export const CreateTradeSchema = z.object({
  tradeId: z.string(),
  fromTokenId: z.string(),
  fromNetworkId: z.string(),
  toTokenId: z.string(),
  toNetworkId: z.string(),
  fromUser: z.string(),
  toUser: z.string(),
  amount: z.string(),
  userDepositTx: z.string(),
  userDepositVault: z.string(),
  tradeDeadline: z.string(),
  scriptDeadline: z.string(),
})

export class CreateTradeDto extends createZodDto(CreateTradeSchema) {}

export const UpdateTradeQuoteSchema = z.object({
  indicativeQuote: z.string().optional(),
  commitmentQuote: z.string().optional(),
  settlementQuote: z.string().optional(),
  executedPriceUsd: z.number().optional(),
})

export class UpdateTradeQuoteDto extends createZodDto(UpdateTradeQuoteSchema) {}

export const UpdateSettlementSchema = z.object({
  settlementTx: z.string(),
})

export class UpdateSettlementDto extends createZodDto(UpdateSettlementSchema) {}

export const GetTradesByStatusSchema = z.object({
  status: z.nativeEnum(TradeStatus),
})

export class GetTradesByStatusDto extends createZodDto(GetTradesByStatusSchema) {}
