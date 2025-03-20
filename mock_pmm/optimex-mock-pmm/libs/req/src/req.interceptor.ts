import { Inject, Injectable, Logger } from '@nestjs/common'

import { AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { v7 as uuidv7 } from 'uuid'

import { REQ_CONFIG_KEY, ReqModuleConfig } from './req.config'

@Injectable()
export class ReqLoggingInterceptor {
  private readonly logger = new Logger('ReqService')
  private requestTimes: Map<string, number> = new Map()

  constructor(
    @Inject(REQ_CONFIG_KEY)
    private readonly config: ReqModuleConfig
  ) {}

  private getTraceId(headers: Record<string, any>): string {
    const possibleHeaders = ['x-request-id', 'x-b3-traceid', 'x-trace-id', 'x-amzn-trace-id', 'traceparent'] as const

    for (const header of possibleHeaders) {
      const headerValue = headers[header]
      if (typeof headerValue === 'string') {
        return headerValue
      }
    }

    return uuidv7()
  }

  onRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (!this.config.enableLogging) return config

    const traceId = (global as any).traceId || this.getTraceId(config.headers || {})
    this.requestTimes.set(traceId, Date.now())

    // Add trace ID to config
    config['traceId'] = traceId

    // Handle headers properly
    if (!config.headers) {
      config.headers = new AxiosHeaders()
    }

    if (!config.headers['x-trace-id']) {
      config.headers.set('x-trace-id', traceId)
    }

    this.logger.log({
      type: 'Request',
      traceId,
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      params: config.params,
      body: config.data,
    })

    return config
  }

  onResponse(response: AxiosResponse): AxiosResponse {
    if (!this.config.enableLogging) return response

    const traceId = response.config['traceId']
    const startTime = this.requestTimes.get(traceId)
    const duration = startTime ? Date.now() - startTime : 0

    this.logger.log({
      type: 'Response',
      traceId,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      url: response.config.url,
      headers: response.headers,
      body: response.data,
    })

    this.requestTimes.delete(traceId)

    // Add traceId to response data if it's an object
    if (typeof response.data === 'object' && response.data !== null) {
      response.data.traceId = traceId
    }

    return response
  }

  onError(error: any): Promise<never> {
    if (!this.config.enableLogging) return Promise.reject(error)

    const traceId = error.config?.['traceId']
    const startTime = this.requestTimes.get(traceId)
    const duration = startTime ? Date.now() - startTime : 0

    this.logger.error({
      type: 'Error',
      traceId,
      url: error.config?.url,
      duration: `${duration}ms`,
      status: error.response?.status,
      error: error.message,
      response: error.response?.data,
    })

    this.requestTimes.delete(traceId)

    // Add traceId to error response if it exists
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data.traceId = traceId
    }

    return Promise.reject(error)
  }
}
