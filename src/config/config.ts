export type Environment = 'development' | 'prelive' | 'production' | 'staging'

export interface EnvironmentConfig {
  backendUrl: string
  rpcUrl: string
  protocolFetcherProxyAddress: string
  isTestnet: boolean
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

export interface ConfigObserver {
  onConfigUpdate(newConfig: AppConfig): void
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    backendUrl: 'https://api-dev.bitdex.xyz',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    protocolFetcherProxyAddress: '0x7E11D5523a2e94CEB6e19ab2f5350dBA769D6F25',
    isTestnet: true,
  },
  staging: {
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    protocolFetcherProxyAddress: 'x7408fDD8f5c195dDD8F6af133d88A82D914D4ac9',
    isTestnet: true,
  },
  prelive: {
    backendUrl: 'https://pre-api.optimex.xyz',
    rpcUrl: 'https://base-rpc.publicnode.com',
    protocolFetcherProxyAddress: '0xFDEd4CEf9aE1E03D0BeF161262a266c1c157a32b',
    isTestnet: false,
  },
  production: {
    backendUrl: 'https://api.optimex.xyz',
    rpcUrl: 'https://base-rpc.publicnode.com',
    protocolFetcherProxyAddress: '0xFDEd4CEf9aE1E03D0BeF161262a266c1c157a32b',
    isTestnet: false,
  },
}

class Config {
  private env: Environment
  private config: EnvironmentConfig
  private observers: ConfigObserver[] = []

  constructor(env: Environment = 'production') {
    this.env = env
    this.config = this.validateAndGetConfig(this.env)
  }

  /**
   * Register a service as an observer to be notified of config changes
   */
  public registerObserver(observer: ConfigObserver): void {
    this.observers.push(observer)
  }

  /**
   * Remove a service from observers
   */
  public unregisterObserver(observer: ConfigObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer)
  }

  /**
   * Set the environment for the SDK
   * @param env The environment to use ('dev' or 'production')
   */
  public setEnvironment(env: Environment): void {
    if (!environments[env]) {
      throw new Error(`Unsupported environment: ${env}`)
    }

    this.env = env
    this.config = environments[env]

    // Notify all observers that config has changed
    const newConfig = this.get()
    this.observers.forEach((observer) => observer.onConfigUpdate(newConfig))
  }

  private validateAndGetConfig(env: Environment): EnvironmentConfig {
    if (!environments[env]) {
      throw new Error(`Unsupported environment: ${env}`)
    }

    return environments[env]
  }

  public get(): AppConfig {
    return {
      env: this.env,
      ...this.config,
    }
  }

  public getBackendUrl(): string {
    return this.config.backendUrl
  }

  public getRpcUrl(): string {
    return this.config.rpcUrl
  }

  public getProtocolFetcherAddress(): string {
    return this.config.protocolFetcherProxyAddress
  }

  public isTestnet(): boolean {
    return this.config.isTestnet
  }
}

// Create singleton instance
export const config = new Config()
