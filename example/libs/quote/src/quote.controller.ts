import { SnakeToCamelInterceptor } from '@bitfi-mock-pmm/shared';
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';

import { GetCommitmentQuoteDto, GetIndicativeQuoteDto } from './quote.dto';
import { QuoteService } from './quote.service';

@Controller()
@UseInterceptors(SnakeToCamelInterceptor)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('indicative-quote')
  getIndicativeQuote(@Query() query: GetIndicativeQuoteDto) {
    return this.quoteService.getIndicativeQuote(query);
  }

  @Get('commitment-quote')
  getCommitmentQuote(@Query() query: GetCommitmentQuoteDto) {
    return this.quoteService.getCommitmentQuote(query);
  }
}
