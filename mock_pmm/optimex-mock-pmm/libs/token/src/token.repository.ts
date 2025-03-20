import { ReqService } from '@bitfi-mock-pmm/req'
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'

import { normalizeSymbol } from './helper'
import { CoinGeckoToken, TokenPrice } from './type'

@Injectable()
export class TokenRepository {
  private readonly CACHE_KEY = 'token_data'
  private readonly TTL = 60 * 1000
  private readonly logger = new Logger(TokenRepository.name)

  constructor(
    @Inject('COINGECKO_REQ_SERVICE') private readonly reqService: ReqService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * Get token price by symbol
   * @param symbol Token symbol (e.g., 'btc', 'eth')
   * @returns Token price information
   */
  async getTokenPrice(symbol: string): Promise<TokenPrice> {
    const targetSymbol = normalizeSymbol(symbol)
    const tokens = await this.getTokens()

    const token = tokens.find((t) => t.symbol.toLowerCase() === targetSymbol.toLowerCase())

    if (!token) {
      throw new NotFoundException(`cannot find token info for symbol ${symbol}`)
    }

    return {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      currentPrice: token.currentPrice,
      marketCap: token.marketCap,
    }
  }

  async getTokens(): Promise<CoinGeckoToken[]> {
    let tokens = await this.getFromCache()
    if (!tokens) {
      tokens = await this.fetchAndCacheTokens()
    }
    return tokens
  }

  private async getFromCache(): Promise<CoinGeckoToken[] | null> {
    const cachedData = await this.cacheManager.get<string>(this.CACHE_KEY)
    return cachedData ? JSON.parse(cachedData) : null
  }

  private async fetchAndCacheTokens(): Promise<CoinGeckoToken[]> {
    try {
      const response = await this.reqService.get<CoinGeckoToken[]>({
        url: '/coins/markets',
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
        },
      })

      await this.cacheManager.set(this.CACHE_KEY, JSON.stringify(response), this.TTL)

      return response
    } catch (error) {
      this.logger.error('Error fetching tokens:', error)
      return []
    }
  }
}
