export interface ReqModuleConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  shouldConvertCase?: boolean;
  timeout?: number;
  maxRedirects?: number;
  enableLogging?: boolean;
}

export const defaultReqConfig: ReqModuleConfig = {
  shouldConvertCase: true,
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5,
  enableLogging: false,
};

export const REQ_CONFIG_KEY = 'REQ_CONFIG' as const;
