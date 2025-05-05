import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ReqModule } from '@optimex-pmm/req'

import { TokenRepository } from './token.repository'

@Module({
  imports: [
    ReqModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        baseUrl: 'https://api.coingecko.com/api/v3',
      }),
      inject: [ConfigService],
      serviceKey: 'COINGECKO_REQ_SERVICE',
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [new KeyvRedis(configService.getOrThrow<string>('REDIS_URL'))],
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [TokenRepository],
  exports: [TokenRepository],
})
export class TokenModule {}
