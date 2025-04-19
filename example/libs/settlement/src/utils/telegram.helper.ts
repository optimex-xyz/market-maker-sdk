import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import axios from 'axios'

@Injectable()
export class TelegramHelper {
  private readonly logger = new Logger(TelegramHelper.name)
  private readonly botToken: string
  private readonly chatId: string
  private readonly baseUrl: string

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.getOrThrow<string>('BOT_TOKEN')
    this.chatId = this.configService.getOrThrow<string>('CHAT_ID')
    this.baseUrl = `https://api.telegram.org`
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/bot${this.botToken}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
      })
    } catch (error: any) {
      this.logger.error(error.response, 'Failed to send telegram message:')
    }
  }
}
