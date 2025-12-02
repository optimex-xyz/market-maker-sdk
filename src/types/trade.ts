import { z } from 'zod'

export enum TradeStatus {
  // Initial states
  INIT = 'INIT',
  PRE_SUBMIT = 'PRE_SUBMIT',

  // Deposit flow
  DEPOSITED = 'DEPOSITED',
  SUBMITTED_TO_BE = 'SUBMITTED_TO_BE',
  SUBMITTED_TO_SOLVER = 'SUBMITTED_TO_SOLVER',

  // Main flow
  SUBMITTED = 'SUBMITTED',
  DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',
  PMM_SELECTED = 'PMM_SELECTED',
  PAYMENT_MADE = 'PAYMENT_MADE',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  SETTLEMENT_CONFIRMED = 'SETTLEMENT_CONFIRMED',

  // Timeout states
  TRADE_TIMEOUT = 'TRADE_TIMEOUT',
  TIMEOUT = 'TIMEOUT',
  TIMEOUT_NO_DEPOSIT = 'TIMEOUT_NO_DEPOSIT',

  // Refund flow
  PRE_REFUND = 'PRE_REFUND',
  REFUNDED = 'REFUNDED',

  // Special states
  RENEW_QUOTE = 'RENEW_QUOTE',
  BRIDGE_FAILED = 'BRIDGE_FAILED',
  BRIDGE_SUCCESS = 'BRIDGE_SUCCESS',
  UNKNOWN = 'UNKNOWN',
}

export enum TradeType {
  OPTIMISTIC = 'OPTIMISTIC',
  BASIC = 'BASIC',
}

export const TradeTokenSchema = z.object({
  id: z.number(),
  chainId: z.string(),
  tokenId: z.string(),
  swapType: z.string(),
  networkId: z.string(),
  tokenName: z.string(),
  networkName: z.string(),
  networkType: z.string(),
  tokenSymbol: z.string(),
  tokenAddress: z.string(),
  tokenLogoUri: z.string(),
  networkSymbol: z.string(),
  tokenDecimals: z.number(),
  networkLogoUri: z.string(),
  canonicalTokenId: z.string(),
  acrossTokenAddress: z.string(),
})

export type TradeToken = z.infer<typeof TradeTokenSchema>

export const TradeEventSchema = z.object({
  id: z.number(),
  tradeId: z.string(),
  action: z.string(),
  txId: z.string().nullable(),
  blockNumber: z.number(),
  timestamp: z.number(),
  inputData: z.record(z.any()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TradeEvent = z.infer<typeof TradeEventSchema>

export const TradeSchema = z.object({
  id: z.number(),
  tradeId: z.string(),
  status: z.nativeEnum(TradeStatus),
  tradeTimeout: z.number().nullable(),
  scriptTimeout: z.number().nullable(),
  timestamp: z.number().nullable(),
  fromUserAddress: z.string().nullable(),
  toUserAddress: z.string().nullable(),
  orgId: z.number().nullable(),
  processedAuto: z.boolean().nullable(),
  processedAt: z.string().nullable(),
  depositTxId: z.string().nullable(),
  settlementTxId: z.string().nullable(),
  toBridgeTxId: z.string().nullable(),
  fromBridgeTxId: z.string().nullable(),
  swapType: z.nativeEnum(TradeType).nullable(),
  amountIn: z.string().nullable(),
  fromToken: TradeTokenSchema.nullable(),
  toToken: TradeTokenSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  events: z.array(TradeEventSchema),
})

export type Trade = z.infer<typeof TradeSchema>

export const TradeResponseSchema = z.object({
  data: TradeSchema,
  traceId: z.string(),
})

export type TradeResponse = z.infer<typeof TradeResponseSchema>
