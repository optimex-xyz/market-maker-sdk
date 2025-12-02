import axios from 'axios'
import { z } from 'zod'

import { AppConfig, config, ConfigObserver } from '../config'
import { Trade, TradeResponseSchema } from '../types'
import { convertToCamelCase } from '../utils'

export class TradeService implements ConfigObserver {
  private baseURL: string

  constructor() {
    this.baseURL = config.getBackendUrl()
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
   * Fetches a trade by its trade ID
   * @param tradeId The unique trade ID (hash)
   * @returns Promise<Trade> The trade details
   * @throws Error if the API request fails or response validation fails
   */
  async getTradeById(tradeId: string): Promise<Trade> {
    try {
      const response = await axios.get<any>(`${this.baseURL}/v1/trades/${tradeId}`, {
        headers: {
          Accept: 'application/json',
        },
      })

      const camelCaseData = convertToCamelCase(response.data)
      const validatedResponse = TradeResponseSchema.parse(camelCaseData)

      return validatedResponse.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
        throw new Error(errorMessage)
      }
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid trade data received: ${error.message}`)
      }
      throw error
    }
  }
}

export const tradeService = new TradeService()
