import { LoggerModule } from 'nestjs-pino';
import { PrismaModule, PrismaServiceOptions } from 'nestjs-prisma';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import pretty from 'pino-pretty';

import { QuoteModule } from '@bitfi-mock-pmm/quote';
import { SettlementModule } from '@bitfi-mock-pmm/settlement';
import { TokenModule } from '@bitfi-mock-pmm/token';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
      envFilePath: ['.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
          },
        },
      },
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory(configService: ConfigService): PrismaServiceOptions {
        return {
          prismaOptions: {
            log: [configService.getOrThrow('LOG_LEVEL')],
            datasourceUrl: configService.getOrThrow('DATABASE_URL'),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: configService.getOrThrow('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    TokenModule,
    QuoteModule,
    SettlementModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
