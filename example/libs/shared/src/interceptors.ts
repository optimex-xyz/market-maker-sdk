/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'

@Injectable()
export class SnakeToCamelInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    if (request.body) {
      request.body = this.convertToCamelCase(request.body)
    }
    if (request.query) {
      request.query = this.convertToCamelCase(request.query)
    }
    return next.handle().pipe(map((data) => this.convertToSnakeCase(data)))
  }

  private convertToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.convertToCamelCase(v))
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [this.snakeToCamelCase(key)]: this.convertToCamelCase(obj[key]),
        }),
        {}
      )
    }
    return obj
  }

  private convertToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.convertToSnakeCase(v))
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [this.camelToSnakeCase(key)]: this.convertToSnakeCase(obj[key]),
        }),
        {}
      )
    }
    return obj
  }

  private snakeToCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''))
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }
}
