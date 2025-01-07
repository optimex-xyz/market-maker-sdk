import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { defaultReqConfig, REQ_CONFIG_KEY, ReqModuleConfig } from './req.config';
import { ReqLoggingInterceptor } from './req.interceptor';
import { ReqService } from './req.service';

export interface ReqModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<ReqModuleConfig> | ReqModuleConfig;
  inject?: any[];
  imports?: any[];
  serviceKey?: string;
}

@Module({})
export class ReqModule {
  static register(
    config: ReqModuleConfig & { serviceKey?: string }
  ): DynamicModule {
    const serviceKey = config.serviceKey || 'DEFAULT_REQ_SERVICE';
    const finalConfig = {
      ...defaultReqConfig,
      ...config,
    };

    return {
      module: ReqModule,
      imports: [HttpModule.register({})],
      providers: [
        {
          provide: REQ_CONFIG_KEY,
          useValue: finalConfig,
        },
        ReqLoggingInterceptor,
        {
          provide: serviceKey,
          useFactory: (
            httpService: HttpService,
            loggingInterceptor: ReqLoggingInterceptor
          ) => {
            return new ReqService(finalConfig, httpService, loggingInterceptor);
          },
          inject: [HttpService, ReqLoggingInterceptor, ConfigService],
        },
      ],
      exports: [serviceKey],
    };
  }

  static registerAsync(options: ReqModuleAsyncOptions): DynamicModule {
    const serviceKey = options.serviceKey || 'DEFAULT_REQ_SERVICE';

    const configProvider: Provider = {
      provide: REQ_CONFIG_KEY,
      useFactory: async (...args) => ({
        ...defaultReqConfig,
        ...(await options.useFactory(...args)),
      }),
      inject: options.inject || [],
    };

    return {
      module: ReqModule,
      imports: [
        HttpModule.registerAsync({
          imports: options.imports,
          useFactory: async (...args) => {
            const config = await options.useFactory(...args);
            return {
              timeout: config.timeout || defaultReqConfig.timeout,
              headers: {
                ...defaultReqConfig.defaultHeaders,
                ...config.defaultHeaders,
              },
            };
          },
          inject: options.inject,
        }),
        ...(options.imports || []),
      ],
      providers: [
        configProvider,
        ReqLoggingInterceptor,
        {
          provide: serviceKey,
          useFactory: (
            config: ReqModuleConfig,
            httpService: HttpService,
            loggingInterceptor: ReqLoggingInterceptor
          ) => {
            return new ReqService(config, httpService, loggingInterceptor);
          },
          inject: [
            REQ_CONFIG_KEY,
            HttpService,
            ReqLoggingInterceptor,
            ConfigService,
          ],
        },
      ],
      exports: [serviceKey],
    };
  }
}
