import axios from 'axios'
import { z } from 'zod'

import { AppConfig, config, ConfigObserver } from '../config'
import { convertToCamelCase, convertToSnakeCase } from '../utils'

// Request validation schema
const SubmitSettlementRequestSchema = z.object({
  tradeIds: z.array(z.string()),
  pmmId: z.string(),
  settlementTx: z.string(),
  signature: z.string(),
  startIndex: z.number(),
  signedAt: z.number(),
})

// Response validation schema
const SubmitSettlementResponseSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
  traceId: z.string(),
})

// Response validation schemas
const TokenInfoSchema = z.object({
  tokenId: z.string(),
  chain: z.string(),
  address: z.string(),
  feeIn: z.boolean(),
  feeOut: z.boolean(),
})

const PMMFinalistSchema = z.object({
  pmmId: z.string(),
  pmmReceivingAddress: z.string(),
})

const PaymentBundleSchema = z.object({
  tradeIds: z.array(z.string()),
  settlementTx: z.string(),
  signature: z.string(),
  startIndex: z.number(),
  pmmId: z.string(),
  signedAt: z.number(),
})

const TradeDetailResponseSchema = z.object({
  data: z.object({
    tradeId: z.string(),
    sessionId: z.string(),
    solverAddress: z.string(),
    fromToken: TokenInfoSchema,
    toToken: TokenInfoSchema,
    amountBeforeFees: z.string(),
    amountAfterFees: z.string(),
    fromUserAddress: z.string(),
    userReceivingAddress: z.string(),
    protocolFeeInBps: z.string(),
    protocolMpcPubkey: z.string(),
    protocolMpcAddress: z.string(),
    bestIndicativeQuote: z.string(),
    displayIndicativeQuote: z.string(),
    pmmFinalists: z.array(PMMFinalistSchema),
    settlementQuote: z.string(),
    receivingAmount: z.string(),
    selectedPmm: z.string(),
    selectedPmmReceivingAddress: z.string(),
    selectedPmmOperator: z.string(),
    selectedPmmSigDeadline: z.number(),
    commitmentRetries: z.number(),
    pmmFailureStats: z.record(z.number()),
    commitedSignature: z.string(),
    minAmountOut: z.null(),
    userDepositTx: z.string(),
    depositVault: z.string(),
    paymentBundle: PaymentBundleSchema,
    userSignature: z.string(),
    tradeSubmissionTx: z.string(),
    tradeSelectPmmTx: z.string(),
    tradeMakePaymentTx: z.string(),
    state: z.string(),
    lastUpdateMsg: z.string(),
    version: z.number(),
    scriptTimeout: z.number(),
    affiliateFeeInBps: z.string(),
    totalFee: z.string(),
    protocolFee: z.string(),
    affiliateFee: z.string(),
    tradeTimeout: z.number(),
  }),
  traceId: z.string(),
})

// Type definitions from schemas
type SubmitSettlementRequest = z.infer<typeof SubmitSettlementRequestSchema>
type SubmitSettlementResponse = z.infer<typeof SubmitSettlementResponseSchema>
type TradeDetailResponse = z.infer<typeof TradeDetailResponseSchema>

export class SolverService implements ConfigObserver {
  private baseURL: string

  constructor() {
    this.baseURL = config.getBackendUrl()
    // Register as an observer
    config.registerObserver(this)
  }

  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(newConfig: AppConfig): void {
    this.baseURL = newConfig.backendUrl
  }

  /**
   * Submits a settlement transaction to the solver backend
   * @param params Settlement transaction parameters
   * @returns Promise with the response message
   * @throws Error if the request fails or validation fails
   */
  async submitSettlementTx(params: SubmitSettlementRequest): Promise<SubmitSettlementResponse> {
    try {
      // Validate request parameters
      SubmitSettlementRequestSchema.parse(params)

      // Convert params to snake_case for API
      const snakeCaseParams = convertToSnakeCase(params)

      const response = await axios.post<SubmitSettlementResponse>(
        `${this.baseURL}/v1/market-maker/submit-settlement-tx`,
        snakeCaseParams,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )
      console.log('🚀 ~ SolverService ~ submitSettlementTx ~ response:', response.data)

      // Validate response
      return SubmitSettlementResponseSchema.parse(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
        throw new Error(errorMessage)
      }
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid data: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get trade details
   * @param tradeId ID of the trade to query
   * @returns Promise with trade details in camelCase format
   * @throws Error if request fails or validation fails
   */
  async getTradeDetail(tradeId: string): Promise<TradeDetailResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/market-maker/trades/${tradeId}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      // Convert snake_case to camelCase before validation
      const camelCaseData = convertToCamelCase(response.data)

      // Validate transformed response
      return TradeDetailResponseSchema.parse(camelCaseData)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
        throw new Error(errorMessage)
      }
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid data: ${error.message}`)
      }
      throw error
    }
  }
}

// Export a singleton instance
export const solverService = new SolverService()
