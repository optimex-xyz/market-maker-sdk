import { TokenModule } from '@bitfi-mock-pmm/token'
import { TradeModule } from '@bitfi-mock-pmm/trade'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { BullBoardModule } from '@bull-board/nestjs'
import { BullModule } from '@nestjs/bull'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { redisStore } from 'cache-manager-redis-yet'
import { RedisClientOptions } from 'redis'

import { SETTLEMENT_QUEUE, SETTLEMENT_QUEUE_NAMES } from './const'
import { TransferFactory } from './factories'
import { SubmitSettlementProcessor } from './processors/submit-settlement.processor'
import { TransferSettlementProcessor } from './processors/transfer-settlement.processor'
import { SettlementController } from './settlement.controller'
import { SettlementService } from './settlement.service'
import { BTCTransferStrategy, EVMTransferStrategy, SolanaTransferStrategy } from './strategies'

const QUEUE_BOARDS = Object.values(SETTLEMENT_QUEUE).map((queue) => ({
  name: queue.NAME,
  adapter: BullAdapter,
}))

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.getOrThrow<string>('REDIS_URL'),
          ttl: 0,
        }),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(...SETTLEMENT_QUEUE_NAMES.map((name) => ({ name }))),
    BullBoardModule.forFeature(...QUEUE_BOARDS),
    TradeModule,
    TokenModule,
  ],
  controllers: [SettlementController],
  providers: [
    SettlementService,
    TransferSettlementProcessor,
    SubmitSettlementProcessor,

    TransferFactory,
    BTCTransferStrategy,
    EVMTransferStrategy,
    SolanaTransferStrategy,
  ],
})
export class SettlementModule {}
