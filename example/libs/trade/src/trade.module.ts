import { DatabaseModule } from '@bitfi-mock-pmm/database';
import { Module } from '@nestjs/common';

import { TradeExistsGuard } from './trade.guard';
import { TradeService } from './trade.service';

@Module({
  imports: [DatabaseModule],
  providers: [TradeService, TradeExistsGuard],
  exports: [TradeService, TradeExistsGuard],
})
export class TradeModule {}
