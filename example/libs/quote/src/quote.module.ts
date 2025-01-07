import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { TokenModule } from '@bitfi-mock-pmm/token';
import { TradeModule } from '@bitfi-mock-pmm/trade';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { QuoteSessionRepository } from './quote-session.repository';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.getOrThrow<string>('REDIS_URL'),
          ttl:
            configService.get<number>('QUOTE_SESSION_TIMEOUT') || 5 * 60 * 1000,
        }),
      }),
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
