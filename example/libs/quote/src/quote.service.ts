import * as crypto from 'crypto'
import { BadRequestException, HttpException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TokenPrice, TokenRepository } from '@optimex-pmm/token'
import { TradeService } from '@optimex-pmm/trade'
import { Token, tokenService } from '@optimex-xyz/market-maker-sdk'

import { ethers } from 'ethers'

import { QuoteSessionRepository } from './quote-session.repository'
import {
  CommitmentQuoteResponse,
  GetCommitmentQuoteDto,
  GetIndicativeQuoteDto,
  IndicativeQuoteResponse,
} from './quote.dto'

@Injectable()
export class QuoteService {
  private readonly EVM_ADDRESS: string
  private readonly BTC_ADDRESS: string
  private readonly PMM_SOLANA_ADDRESS: string
  private readonly tokenService = tokenService
  private readonly ONLY_SOLANA: boolean
  private readonly MIN_TRADE: number
  private readonly MAX_TRADE: number
  private readonly BONUS_PERCENTAGE: number

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenRepo: TokenRepository,
    private readonly tradeService: TradeService,
    private readonly sessionRepo: QuoteSessionRepository
  ) {
    this.EVM_ADDRESS = this.configService.getOrThrow<string>('PMM_EVM_ADDRESS')
    this.BTC_ADDRESS = this.configService.getOrThrow<string>('PMM_BTC_ADDRESS')
    this.PMM_SOLANA_ADDRESS = this.configService.getOrThrow<string>('PMM_SOLANA_ADDRESS')
    this.ONLY_SOLANA = this.configService.get<string>('ONLY_SOLANA') === 'true'
    this.MIN_TRADE = Number(this.configService.getOrThrow<string>('MIN_TRADE'))
    this.MAX_TRADE = Number(this.configService.getOrThrow<string>('MAX_TRADE'))
    this.BONUS_PERCENTAGE = Number(this.configService.getOrThrow<string>('BONUS_PERCENTAGE', '103'))
  }

  private getPmmAddressByNetworkType(token: Token): string {
    switch (token.networkType.toUpperCase()) {
      case 'EVM':
        return this.EVM_ADDRESS
      case 'BTC':
      case 'TBTC':
        return this.BTC_ADDRESS
      case 'SOLANA':
        return this.PMM_SOLANA_ADDRESS
      default:
        throw new BadRequestException(`Unsupported network type: ${token.networkType}`)
    }
  }
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private calculateBestQuote(
    amountIn: string,
    fromToken: Token,
    toToken: Token,
    fromTokenPrice: TokenPrice,
    toTokenPrice: TokenPrice,
    isCommitment = false
  ): string {
    const amount = ethers.getBigInt(amountIn)
    const fromDecimals = ethers.getBigInt(fromToken.tokenDecimals)
    const toDecimals = ethers.getBigInt(toToken.tokenDecimals)
    const fromPrice = ethers.getBigInt(Math.round(fromTokenPrice.currentPrice * 1e6))
    const toPrice = ethers.getBigInt(Math.round(toTokenPrice.currentPrice * 1e6))
    const rawQuote = (amount * fromPrice * 10n ** toDecimals) / (toPrice * 10n ** fromDecimals)

    const bonusPercentage = isCommitment ? this.BONUS_PERCENTAGE + 1 : this.BONUS_PERCENTAGE
    const quoteWithBonus = (rawQuote * BigInt(bonusPercentage)) / 100n
    return quoteWithBonus.toString()
  }

  private validateSolanaRequirement(fromToken: Token, toToken: Token) {
    if (!this.ONLY_SOLANA) {
      return
    }

    const isFromTokenSolana = fromToken.networkType.toUpperCase() === 'SOLANA'
    const isToTokenSolana = toToken.networkType.toUpperCase() === 'SOLANA'

    if (!isFromTokenSolana && !isToTokenSolana) {
      throw new Error('At least one token must be on the Solana network. Please check your token IDs.')
    }
  }

  private validateTradeAmount(amount: string, tokenPrice: TokenPrice, token: Token): void {
    // Convert amount to actual token units using ethers
    const actualAmount = ethers.formatUnits(amount, token.tokenDecimals)

    // Calculate USD value using BigInt for precision (2 decimals for USD)
    const amountInUsd = ethers.parseUnits((Number(actualAmount) * tokenPrice.currentPrice).toFixed(2), 2)

    const minTradeAmount = ethers.parseUnits(this.MIN_TRADE.toFixed(2), 2)
    const maxTradeAmount = ethers.parseUnits(this.MAX_TRADE.toFixed(2), 2)

    if (amountInUsd < minTradeAmount) {
      throw new BadRequestException(
        `Trade amount ${ethers.formatUnits(amountInUsd, 2)} USD is below minimum allowed: ${this.MIN_TRADE} USD`
      )
    }

    if (amountInUsd > maxTradeAmount) {
      throw new BadRequestException(
        `Trade amount ${ethers.formatUnits(amountInUsd, 2)} USD exceeds maximum allowed: ${this.MAX_TRADE} USD`
      )
    }
  }

  async getIndicativeQuote(dto: GetIndicativeQuoteDto): Promise<IndicativeQuoteResponse> {
    const sessionId = dto.sessionId || this.generateSessionId()

    try {
      const [fromToken, toToken] = await Promise.all([
        this.tokenService.getTokenByTokenId(dto.fromTokenId),
        this.tokenService.getTokenByTokenId(dto.toTokenId),
      ]).catch((error) => {
        throw new BadRequestException(`Failed to fetch tokens: ${error.message}`)
      })

      this.validateSolanaRequirement(fromToken, toToken)

      const [fromTokenPrice, toTokenPrice] = await Promise.all([
        this.tokenRepo.getTokenPrice(fromToken.tokenSymbol),
        this.tokenRepo.getTokenPrice(toToken.tokenSymbol),
      ]).catch((error) => {
        throw new BadRequestException(`Failed to fetch token prices: ${error.message}`)
      })

      this.validateTradeAmount(dto.amount, fromTokenPrice, fromToken)

      const quote = this.calculateBestQuote(dto.amount, fromToken, toToken, fromTokenPrice, toTokenPrice, false)

      const pmmAddress = this.getPmmAddressByNetworkType(fromToken)

      await this.sessionRepo.save(sessionId, {
        fromToken: dto.fromTokenId,
        toToken: dto.toTokenId,
        amount: dto.amount,
        pmmReceivingAddress: pmmAddress,
        indicativeQuote: quote,
      })

      return {
        sessionId,
        pmmReceivingAddress: pmmAddress,
        indicativeQuote: quote,
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }

  async getCommitmentQuote(dto: GetCommitmentQuoteDto): Promise<CommitmentQuoteResponse> {
    try {
      const session = await this.sessionRepo.findById(dto.sessionId)
      if (!session) {
        throw new BadRequestException('Session expired during processing')
      }

      const [fromToken, toToken] = await Promise.all([
        this.tokenService.getTokenByTokenId(dto.fromTokenId),
        this.tokenService.getTokenByTokenId(dto.toTokenId),
      ]).catch((error) => {
        throw new BadRequestException(`Failed to fetch tokens: ${error.message}`)
      })

      this.validateSolanaRequirement(fromToken, toToken)

      const [fromTokenPrice, toTokenPrice] = await Promise.all([
        this.tokenRepo.getTokenPrice(fromToken.tokenSymbol),
        this.tokenRepo.getTokenPrice(toToken.tokenSymbol),
      ]).catch((error) => {
        throw new BadRequestException(dto.tradeId, `Failed to fetch token prices: ${error.message}`)
      })

      await this.tradeService.deleteTrade(dto.tradeId)

      const quote = this.calculateBestQuote(dto.amount, fromToken, toToken, fromTokenPrice, toTokenPrice, true)

      const trade = await this.tradeService
        .createTrade({
          tradeId: dto.tradeId,
          fromTokenId: dto.fromTokenId,
          toTokenId: dto.toTokenId,
          fromUser: dto.fromUserAddress,
          toUser: dto.toUserAddress,
          amount: dto.amount,
          fromNetworkId: fromToken.networkId,
          toNetworkId: toToken.networkId,
          userDepositTx: dto.userDepositTx,
          userDepositVault: dto.userDepositVault,
          tradeDeadline: dto.tradeDeadline,
          scriptDeadline: dto.scriptDeadline,
        })
        .catch((error) => {
          throw new BadRequestException(`Failed to create trade: ${error.message}`)
        })

      await this.tradeService
        .updateTradeQuote(trade.tradeId, {
          commitmentQuote: quote,
        })
        .catch((error) => {
          throw new BadRequestException(`Failed to update trade quote: ${error.message}`)
        })

      return {
        tradeId: dto.tradeId,
        commitmentQuote: quote,
        error: '',
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException(error.message)
    }
  }
}
