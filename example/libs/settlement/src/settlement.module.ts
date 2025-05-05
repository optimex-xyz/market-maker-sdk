import { BullAdapter } from '@bull-board/api/bullAdapter'
import { BullBoardModule } from '@bull-board/nestjs'
import KeyvRedis from '@keyv/redis'
import { BullModule } from '@nestjs/bull'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TokenModule } from '@optimex-pmm/token'
import { TradeModule } from '@optimex-pmm/trade'

import { BalanceMonitorScheduler } from './balance-monitor.scheduler'
import { SETTLEMENT_QUEUE, SETTLEMENT_QUEUE_NAMES } from './const'
import { TransferFactory } from './factories'
import { SubmitSettlementProcessor } from './processors/submit-settlement.processor'
import { TransferSettlementProcessor } from './processors/transfer-settlement.processor'
import { SettlementController } from './settlement.controller'
import { SettlementService } from './settlement.service'
import { BTCTransferStrategy, EVMTransferStrategy, SolanaTransferStrategy } from './strategies'
import { TelegramHelper } from './utils/telegram.helper'

const QUEUE_BOARDS = Object.values(SETTLEMENT_QUEUE).map((queue) => ({
  name: queue.NAME,
  adapter: BullAdapter,
}))

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ttl: 0,
          stores: [new KeyvRedis(configService.getOrThrow<string>('REDIS_URL'))],
        }
      },
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
    BalanceMonitorScheduler,
    TelegramHelper,

    TransferFactory,
    BTCTransferStrategy,
    EVMTransferStrategy,
    SolanaTransferStrategy,
  ],
})
export class SettlementModule {}
