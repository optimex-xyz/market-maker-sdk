import { Controller, Get } from '@nestjs/common'
import { TransformedQuery } from '@optimex-pmm/shared'

import { GetCommitmentQuoteDto, GetIndicativeQuoteDto } from './quote.dto'
import { QuoteService } from './quote.service'

@Controller()
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('indicative-quote')
  getIndicativeQuote(@TransformedQuery() query: GetIndicativeQuoteDto) {
    return this.quoteService.getIndicativeQuote(query)
  }

  @Get('commitment-quote')
  getCommitmentQuote(@TransformedQuery() query: GetCommitmentQuoteDto) {
    return this.quoteService.getCommitmentQuote(query)
  }
}
