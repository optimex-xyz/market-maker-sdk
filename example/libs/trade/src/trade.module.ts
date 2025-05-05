import { Module } from '@nestjs/common'
import { DatabaseModule } from '@optimex-pmm/database'

import { TradeExistsGuard } from './trade.guard'
import { TradeService } from './trade.service'

@Module({
  imports: [DatabaseModule],
  providers: [TradeService, TradeExistsGuard],
  exports: [TradeService, TradeExistsGuard],
})
export class TradeModule {}
