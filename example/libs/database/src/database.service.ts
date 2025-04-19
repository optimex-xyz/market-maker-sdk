import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name)

  constructor() {
    super({
      log: [{ emit: 'event', level: 'query' }],
    })
  }

  async onModuleInit() {
    await this.$connect()

    // Log queries with colors
    // @ts-expect-error: ignore here
    this.$on('query', (e: any) => {
      const colors: Record<QueryType | 'default', string> = {
        SELECT: '\x1b[36m', // Cyan
        INSERT: '\x1b[32m', // Green
        UPDATE: '\x1b[33m', // Yellow
        DELETE: '\x1b[31m', // Red
        default: '\x1b[35m', // Magenta
      }
      const reset = '\x1b[0m'

      const queryType = e.query.split(' ')[0].toUpperCase() as QueryType
      const color = colors[queryType] || colors.default

      this.logger.log(`${color}Query: ${e.query}${reset} | Params: ${e.params} | Duration: ${e.duration}ms`)
    })
  }
}
