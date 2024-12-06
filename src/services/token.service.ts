import axios from 'axios';
import { z } from 'zod';

import config from '../config/config';
import { Token, TokenSchema } from '../types';
import { convertToCamelCase } from '../utils';

// Response schema for the API
const TokenResponseSchema = z.object({
  data: z.array(TokenSchema),
  traceId: z.string(),
})

export class TokenService {
  private readonly baseURL: string

  constructor() {
    this.baseURL = config.getBackendUrl()
  }

  /**
   * Fetches all available tokens from the API
   * @returns Promise<Token[]> Array of tokens
   * @throws Error if the API request fails or response validation fails
   */
  async getTokens(): Promise<Token[]> {
    try {
      const response = await axios.get<any>(`${this.baseURL}/tokens`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BitFi-Market-Maker-SDK',
        },
      })

      // Convert snake_case to camelCase before validation
      const camelCaseData = convertToCamelCase(response.data)

      // Validate the converted data against our schema
      const validatedResponse = TokenResponseSchema.parse(camelCaseData)

      return validatedResponse.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch tokens: ${error.message}`)
      }
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid token data received: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Fetches a specific token by its ID
   * @param id Token ID to fetch
   * @returns Promise<Token | null> Token if found, null otherwise
   */
  async getTokenById(id: number): Promise<Token | null> {
    const tokens = await this.getTokens()
    return tokens.find((token) => token.id === id) ?? null
  }

  /**
   * Fetches tokens by network ID
   * @param networkId Network ID to filter by
   * @returns Promise<Token[]> Array of tokens for the specified network
   */
  async getTokensByNetwork(networkId: string): Promise<Token[]> {
    const tokens = await this.getTokens()
    return tokens.filter((token) => token.networkId === networkId)
  }
}

// Export a singleton instance
export const tokenService = new TokenService()
