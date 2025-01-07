import * as crypto from 'crypto';
import { ethers } from 'ethers';

import { TokenPrice, TokenRepository } from '@bitfi-mock-pmm/token';
import { TradeService } from '@bitfi-mock-pmm/trade';
import { Token, tokenService } from '@bitfixyz/market-maker-sdk';
import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { QuoteSessionRepository } from './quote-session.repository';
import {
  CommitmentQuoteResponse,
  GetCommitmentQuoteDto,
  GetIndicativeQuoteDto,
  IndicativeQuoteResponse,
} from './quote.dto';

@Injectable()
export class QuoteService {
  private readonly EVM_ADDRESS: string;
  private readonly BTC_ADDRESS: string;
  private readonly tokenService = tokenService;

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenRepo: TokenRepository,
    private readonly tradeService: TradeService,
    private readonly sessionRepo: QuoteSessionRepository
  ) {
    this.EVM_ADDRESS = this.configService.getOrThrow<string>('PMM_EVM_ADDRESS');
    this.BTC_ADDRESS = this.configService.getOrThrow<string>('PMM_BTC_ADDRESS');
  }

  private getPmmAddressByNetworkType(token: Token): string {
    switch (token.networkType.toUpperCase()) {
      case 'EVM':
        return this.EVM_ADDRESS;
      case 'BTC':
      case 'TBTC':
        return this.BTC_ADDRESS;
      default:
        throw new BadRequestException(
          `Unsupported network type: ${token.networkType}`
        );
    }
  }
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private calculateBestQuote(
    amountIn: string,
    fromToken: Token,
    toToken: Token,
    fromTokenPrice: TokenPrice,
    toTokenPrice: TokenPrice
  ): string {
    const amount = ethers.getBigInt(amountIn);
    const fromDecimals = ethers.getBigInt(fromToken.tokenDecimals);
    const toDecimals = ethers.getBigInt(toToken.tokenDecimals);
    const fromPrice = ethers.getBigInt(
      Math.round(fromTokenPrice.currentPrice * 1e6)
    );
    const toPrice = ethers.getBigInt(
      Math.round(toTokenPrice.currentPrice * 1e6)
    );
    const rawQuote =
      (amount * fromPrice * 10n ** toDecimals) /
      (toPrice * 10n ** fromDecimals);

    const quoteWithBonus = (rawQuote * 103n) / 100n;
    return quoteWithBonus.toString();
  }

  async getIndicativeQuote(
    dto: GetIndicativeQuoteDto
  ): Promise<IndicativeQuoteResponse> {
    const sessionId = dto.sessionId || this.generateSessionId();

    try {
      const [fromToken, toToken] = await Promise.all([
        this.tokenService.getTokenByTokenId(dto.fromTokenId),
        this.tokenService.getTokenByTokenId(dto.toTokenId),
      ]).catch((error) => {
        throw new BadRequestException(
          `Failed to fetch tokens: ${error.message}`
        );
      });

      const [fromTokenPrice, toTokenPrice] = await Promise.all([
        this.tokenRepo.getTokenPrice(fromToken.tokenSymbol),
        this.tokenRepo.getTokenPrice(toToken.tokenSymbol),
      ]).catch((error) => {
        throw new BadRequestException(
          `Failed to fetch token prices: ${error.message}`
        );
      });

      const quote = this.calculateBestQuote(
        dto.amount,
        fromToken,
        toToken,
        fromTokenPrice,
        toTokenPrice
      );

      const pmmAddress = this.getPmmAddressByNetworkType(fromToken);

      await this.sessionRepo.save(sessionId, {
        fromToken: dto.fromTokenId,
        toToken: dto.toTokenId,
        amount: dto.amount,
        pmmReceivingAddress: pmmAddress,
        indicativeQuote: quote,
      });

      return {
        sessionId,
        pmmReceivingAddress: pmmAddress,
        indicativeQuote: quote,
        error: '',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async getCommitmentQuote(
    dto: GetCommitmentQuoteDto
  ): Promise<CommitmentQuoteResponse> {
    try {
      const session = await this.sessionRepo.findById(dto.sessionId);
      if (!session) {
        throw new BadRequestException('Session expired during processing');
      }

      const [fromToken, toToken] = await Promise.all([
        this.tokenService.getTokenByTokenId(dto.fromTokenId),
        this.tokenService.getTokenByTokenId(dto.toTokenId),
      ]).catch((error) => {
        throw new BadRequestException(
          `Failed to fetch tokens: ${error.message}`
        );
      });

      const [fromTokenPrice, toTokenPrice] = await Promise.all([
        this.tokenRepo.getTokenPrice(fromToken.tokenSymbol),
        this.tokenRepo.getTokenPrice(toToken.tokenSymbol),
      ]).catch((error) => {
        throw new BadRequestException(
          dto.tradeId,
          `Failed to fetch token prices: ${error.message}`
        );
      });

      await this.tradeService.deleteTrade(dto.tradeId);

      const quote = this.calculateBestQuote(
        dto.amount,
        fromToken,
        toToken,
        fromTokenPrice,
        toTokenPrice
      );

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
          throw new BadRequestException(
            `Failed to create trade: ${error.message}`
          );
        });

      await this.tradeService
        .updateTradeQuote(trade.tradeId, {
          commitmentQuote: quote,
        })
        .catch((error) => {
          throw new BadRequestException(
            `Failed to update trade quote: ${error.message}`
          );
        });

      return {
        tradeId: dto.tradeId,
        commitmentQuote: quote,
        error: '',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
