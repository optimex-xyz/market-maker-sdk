import axios from 'axios'
import { z } from 'zod'

import { config } from '../config'
import { Token, TokenSchema } from '../types'
import { convertToCamelCase } from '../utils'

const TokenResponseSchema = z.object({
  data: z.object({
    tokens: z.array(TokenSchema),
  }),
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
      const response = await axios.get<any>(`${this.baseURL}/v1/tokens`, {
        headers: {
          Accept: 'application/json',
        },
      })

      // Convert snake_case to camelCase before validation
      const camelCaseData = convertToCamelCase(response.data)

      // Validate the converted data against our schema
      const validatedResponse = TokenResponseSchema.parse(camelCaseData)

      return validatedResponse.data.tokens
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
   * Fetches a specific token by its token ID
   * @param tokenId Token ID to fetch
   * @returns Promise<Token> Token if found, null otherwise
   */
  async getTokenByTokenId(tokenId: string): Promise<Token> {
    const tokens = await this.getTokens()
    const token = tokens.find((token) => token.tokenId === tokenId)

    if (!token) {
      throw new Error(`Token with tokenId ${tokenId} not found`)
    }

    return token
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

  /**
   * Finds a specific token by network ID and token address
   * @param networkId Network ID to search for
   * @param tokenAddress Token address to search for (use 'native' for native tokens)
   * @returns Promise<Token> Token if found
   * @throws Error if token is not found
   */
  async getToken(networkId: string, tokenAddress: string): Promise<Token> {
    try {
      const tokens = await this.getTokens()
      const token = tokens.find(
        (t) => t.networkId === networkId && t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      )

      if (!token) {
        throw new Error(`Token not found for networkId: ${networkId} and address: ${tokenAddress}`)
      }

      return token
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to get token: ${error}`)
    }
  }
}

// Export a singleton instance
export const tokenService = new TokenService()
