import axios from 'axios'
import { z } from 'zod'

import config from '../config/config'
import { convertToSnakeCase } from '../utils'

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
  message: z.string(),
})

// Type definitions from schemas
type SubmitSettlementRequest = z.infer<typeof SubmitSettlementRequestSchema>
type SubmitSettlementResponse = z.infer<typeof SubmitSettlementResponseSchema>

export class SolverService {
  private readonly baseURL: string

  constructor() {
    this.baseURL = config.getSolverUrl()
  }

  /**
   * Submits a settlement transaction to the solver backend
   * @param params Settlement transaction parameters
   * @returns Promise with the response message
   * @throws Error if the request fails or validation fails
   */
  async submitSettlementTx(
    params: SubmitSettlementRequest
  ): Promise<SubmitSettlementResponse> {
    try {
      // Validate request parameters
      SubmitSettlementRequestSchema.parse(params)

      // Convert params to snake_case for API
      const snakeCaseParams = convertToSnakeCase(params)

      const response = await axios.post<SubmitSettlementResponse>(
        `${this.baseURL}/submit-settlement-tx`,
        snakeCaseParams,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      // Validate response
      return SubmitSettlementResponseSchema.parse(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to submit settlement transaction: ${error.message}`
        )
      }
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid data: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Helper function to format and submit a single trade settlement
   * @param tradeId The ID of the trade to settle
   * @param pmmId The PMM's identifier
   * @param settlementTx The settlement transaction data
   * @param signature The PMM's signature
   */
  async submitSingleSettlement(
    tradeId: string,
    pmmId: string,
    settlementTx: string,
    signature: string,
    signedAt: number
  ): Promise<SubmitSettlementResponse> {
    return this.submitSettlementTx({
      tradeIds: [tradeId],
      pmmId,
      settlementTx,
      signature,
      startIndex: 0,
      signedAt,
    })
  }

  /**
   * Helper function to submit multiple trade settlements in one transaction
   * @param tradeIds Array of trade IDs to settle
   * @param pmmId The PMM's identifier
   * @param settlementTx The settlement transaction data
   * @param signature The PMM's signature
   * @param startIndex Starting index for batch processing
   */
  async submitBatchSettlement(
    tradeIds: string[],
    pmmId: string,
    settlementTx: string,
    signature: string,
    signedAt: number,
    startIndex: number = 0
  ): Promise<SubmitSettlementResponse> {
    return this.submitSettlementTx({
      tradeIds,
      pmmId,
      settlementTx,
      signature,
      startIndex,
      signedAt,
    })
  }
}

// Export a singleton instance
export const solverService = new SolverService()
