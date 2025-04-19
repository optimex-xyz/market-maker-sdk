/* eslint-disable @typescript-eslint/no-unused-vars */
import { convertToCamelCase, convertToSnakeCase } from '@bitfi-mock-pmm/shared'
import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'

import { AxiosRequestConfig } from 'axios'
import { lastValueFrom } from 'rxjs'

import { ReqModuleConfig } from './req.config'
import { ReqLoggingInterceptor } from './req.interceptor'

export interface ReqOptions extends Omit<AxiosRequestConfig, 'url'> {
  url?: string
  endpoint?: string
  params?: Record<string, any>
  urlParams?: Record<string, any>
  payload?: any
  skipCaseConversion?: boolean
  baseUrl?: string
}

@Injectable()
export class ReqService {
  private baseUrl?: string

  constructor(
    private readonly config: ReqModuleConfig,
    private readonly httpService: HttpService,
    private readonly loggingInterceptor: ReqLoggingInterceptor
  ) {
    this.baseUrl = config.baseUrl

    this.httpService.axiosRef.interceptors.request.use(
      (config) => this.loggingInterceptor.onRequest(config),
      (error) => this.loggingInterceptor.onError(error)
    )

    this.httpService.axiosRef.interceptors.response.use(
      (response) => this.loggingInterceptor.onResponse(response),
      (error) => this.loggingInterceptor.onError(error)
    )
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  private convertCase<T>(data: T, toSnake = true, skip = false): T {
    if (skip || !this.config.shouldConvertCase) return data
    if (typeof data !== 'object' || data === null) return data
    return (toSnake ? convertToSnakeCase : convertToCamelCase)(data as Record<string, any>) as T
  }

  private interpolateUrl(url: string, params: Record<string, any>): string {
    return Object.entries(params).reduce((acc, [key, value]) => acc.replace(`:${key}`, String(value)), url)
  }

  private getFullUrl(options: ReqOptions): string {
    const baseUrl = options.baseUrl || this.baseUrl || ''
    const url = options.url || options.endpoint || ''

    if (!baseUrl && !url.startsWith('http')) {
      throw new Error('baseUrl must be provided either in config, service or request options')
    }

    return `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1')
  }

  private async request<T = any>(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', options: ReqOptions): Promise<T> {
    const {
      url,
      endpoint,
      params,
      urlParams,
      payload,
      skipCaseConversion = false,
      baseUrl,
      headers,
      ...restOptions
    } = options

    let finalUrl = this.getFullUrl(options)

    if (urlParams) {
      finalUrl = this.interpolateUrl(finalUrl, this.convertCase(urlParams, true, skipCaseConversion))
    }

    const requestHeaders = {
      ...this.config.defaultHeaders,
      ...headers,
    }

    const requestConfig: AxiosRequestConfig = {
      ...restOptions,
      method,
      url: finalUrl,
      headers: requestHeaders,
      params: params ? this.convertCase(params, true, skipCaseConversion) : undefined,
      data: payload !== undefined ? this.convertCase(payload, true, skipCaseConversion) : undefined,
      timeout: options.timeout || this.config.timeout,
    }

    const response = await lastValueFrom(this.httpService.request<T>(requestConfig))

    return this.convertCase(response.data, false, skipCaseConversion)
  }

  async get<T = any>(options: ReqOptions): Promise<T> {
    return this.request<T>('GET', options)
  }

  async post<T = any>(options: ReqOptions): Promise<T> {
    return this.request<T>('POST', options)
  }

  async put<T = any>(options: ReqOptions): Promise<T> {
    return this.request<T>('PUT', options)
  }

  async patch<T = any>(options: ReqOptions): Promise<T> {
    return this.request<T>('PATCH', options)
  }

  async delete<T = any>(options: ReqOptions): Promise<T> {
    return this.request<T>('DELETE', options)
  }

  async upload<T = any>(file: File | FormData, options: Omit<ReqOptions, 'payload'>): Promise<T> {
    let formData: FormData

    if (file instanceof File) {
      formData = new FormData()
      formData.append('file', file)
    } else {
      formData = file
    }

    return this.post<T>({
      ...options,
      payload: formData,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data',
      },
      skipCaseConversion: true,
    })
  }
}
