/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger as PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino'
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app/app.module'
import { ResponseExceptionFilter } from './interceptors/response-exception.filter'
import { ResponseLoggerInterceptor } from './interceptors/response-logger.interceptor'
import { TraceIdInterceptor } from './interceptors/trace-id.interceptor'
import { ZodValidationExceptionFilter } from './interceptors/zod-validation-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  })

  patchNestJsSwagger()
  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalInterceptors(new ResponseLoggerInterceptor())

  app.useGlobalFilters(new ResponseExceptionFilter(), new ZodValidationExceptionFilter())
  app.useGlobalInterceptors(new LoggerErrorInterceptor(), new TraceIdInterceptor())

  app.useLogger(app.get(PinoLogger))

  const config = new DocumentBuilder()
    .setTitle('Mock PMM')
    .setDescription('The Mock PMM API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory)

  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}`)
}

bootstrap()
