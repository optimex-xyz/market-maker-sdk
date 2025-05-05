import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TokenModule } from '@optimex-pmm/token'
import { TradeModule } from '@optimex-pmm/trade'

import { QuoteSessionRepository } from './quote-session.repository'
import { QuoteController } from './quote.controller'
import { QuoteService } from './quote.service'

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ttl: configService.get<number>('QUOTE_SESSION_TIMEOUT') || 24 * 60 * 60 * 1000,
          stores: [new KeyvRedis(configService.getOrThrow<string>('REDIS_URL'))],
        }
      },
      inject: [ConfigService],
    }),
    TokenModule,
    TradeModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, QuoteSessionRepository],
  exports: [QuoteService],
})
export class QuoteModule {}
