import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { TransformedBody, TransformedQuery } from '@optimex-pmm/shared'
import { TradeExistsGuard } from '@optimex-pmm/trade'

import {
  AckSettlementDto,
  GetSettlementSignatureDto,
  SignalPaymentDto,
  SignalPaymentResponseDto,
} from './settlement.dto'
import { SettlementService } from './settlement.service'

@Controller()
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('settlement-signature')
  @UseGuards(TradeExistsGuard)
  getSettlementSignature(@TransformedQuery() query: GetSettlementSignatureDto, @Req() req: any) {
    return this.settlementService.getSettlementSignature(query, req.trade)
  }

  @Post('ack-settlement')
  @UseGuards(TradeExistsGuard)
  ackSettlement(@TransformedBody() body: AckSettlementDto) {
    return this.settlementService.ackSettlement(body)
  }

  @Post('signal-payment')
  @UseGuards(TradeExistsGuard)
  signalPayment(@TransformedBody() body: SignalPaymentDto, @Req() req: any): Promise<SignalPaymentResponseDto> {
    return this.settlementService.signalPayment(body, req.trade)
  }
}
