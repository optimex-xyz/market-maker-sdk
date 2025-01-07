import { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const firstError = exception.getZodError().errors[0]

    const fieldName = firstError.path[firstError.path.length - 1].toString()

    return response.status(400).json({
      statusCode: 400,
      message: `${fieldName} ${firstError.message}`,
      error: 'Bad Request',
    })
  }
}
