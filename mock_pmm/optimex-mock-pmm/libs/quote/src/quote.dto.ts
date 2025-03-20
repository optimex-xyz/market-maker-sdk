import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const GetIndicativeQuoteSchema = z.object({
  fromTokenId: z.string(),
  toTokenId: z.string(),
  amount: z.string(),
  sessionId: z.string().optional(),
})

export class GetIndicativeQuoteDto extends createZodDto(GetIndicativeQuoteSchema) {}

export const IndicativeQuoteResponseSchema = z.object({
  sessionId: z.string(),
  pmmReceivingAddress: z.string(),
  indicativeQuote: z.string(),
  error: z.string().optional(),
})

export type IndicativeQuoteResponse = z.infer<typeof IndicativeQuoteResponseSchema>

export const GetCommitmentQuoteSchema = z.object({
  sessionId: z.string(),
  tradeId: z.string(),
  fromTokenId: z.string(),
  toTokenId: z.string(),
  amount: z.string(),
  fromUserAddress: z.string(),
  toUserAddress: z.string(),
  userDepositTx: z.string(),
  userDepositVault: z.string(),
  tradeDeadline: z.string(),
  scriptDeadline: z.string(),
})

export class GetCommitmentQuoteDto extends createZodDto(GetCommitmentQuoteSchema) {}

export const CommitmentQuoteResponseSchema = z.object({
  tradeId: z.string(),
  commitmentQuote: z.string(),
  error: z.string().optional(),
})

export type CommitmentQuoteResponse = z.infer<typeof CommitmentQuoteResponseSchema>
