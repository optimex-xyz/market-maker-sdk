import { SnakeToCamelInterceptor } from '@bitfi-mock-pmm/shared'
import { TradeExistsGuard } from '@bitfi-mock-pmm/trade'
import { Controller, Get, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common'

import {
  AckSettlementDto,
  GetSettlementSignatureDto,
  SignalPaymentDto,
  SignalPaymentResponseDto,
  SubmitTxDTO,
} from './settlement.dto'
import { SettlementService } from './settlement.service'

@Controller()
@UseInterceptors(SnakeToCamelInterceptor)
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('settlement-signature')
  @UseGuards(TradeExistsGuard)
  getSettlementSignature(@Query() query: GetSettlementSignatureDto, @Req() req: any) {
    return this.settlementService.getSettlementSignature(query, req.trade)
  }

  @Get('ack-settlement')
  @UseGuards(TradeExistsGuard)
  ackSettlement(@Query() query: AckSettlementDto, @Req() req: any) {
    return this.settlementService.ackSettlement(query, req.trade)
  }

  @Post('signal-payment')
  @UseGuards(TradeExistsGuard)
  signalPayment(@Query() body: SignalPaymentDto, @Req() req: any): Promise<SignalPaymentResponseDto> {
    return this.settlementService.signalPayment(body, req.trade)
  }

  @Get('submit-tx')
  @UseGuards(TradeExistsGuard)
  submitTx(@Query() body: SubmitTxDTO) {
    return this.settlementService.submitTx(body)
  }
}
