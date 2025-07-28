export type Environment = 'development' | 'prelive' | 'production' | 'staging'

export interface EnvironmentConfig {
  backendUrl: string
  rpcUrl: string
  paymentAddressMap: Record<string, string>
  liquidationAddressMap: Record<string, string>
  protocolFetcherProxyAddress: string
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
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    protocolFetcherProxyAddress: '0x0267Fc04eE866b31907dEe123aBdCdB67d03B297',
    paymentAddressMap: {
      ethereum_sepolia: '0x1d8b58438D5Ccc8Fcb4b738C89078f7b4168C9c0',
    },
    liquidationAddressMap: {
      ethereum_sepolia: '0x63f56c6e602f288821bea31ccdd9b1e189305f38',
    },
  },
  staging: {
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    protocolFetcherProxyAddress: '0x7c07151ca4DFd93F352Ab9B132A95866697c38c2',
    paymentAddressMap: {
      ethereum_sepolia: '0x7387DcCfE2f1D5F80b4ECDF91eF58541517e90D2',
    },
    liquidationAddressMap: {},
  },
  prelive: {
    backendUrl: 'https://pre-api.optimex.xyz',
    rpcUrl: 'https://rpc.optimex.xyz',
    protocolFetcherProxyAddress: '0xFDEd4CEf9aE1E03D0BeF161262a266c1c157a32b',
    paymentAddressMap: {
      ethereum: '0x0A497AC4261E37FA4062762C23Cf3cB642C839b8',
    },
    liquidationAddressMap: {},
  },
  production: {
    backendUrl: 'https://api.optimex.xyz',
    rpcUrl: 'https://rpc.optimex.xyz',
    protocolFetcherProxyAddress: '0xFDEd4CEf9aE1E03D0BeF161262a266c1c157a32b',
    paymentAddressMap: {
      ethereum: '0x0A497AC4261E37FA4062762C23Cf3cB642C839b8',
    },
    liquidationAddressMap: {},
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

  public getPaymentAddress(networkId: string): string {
    return this.config.paymentAddressMap[networkId]
  }

  public getLiquidationAddress(networkId: string): string {
    return this.config.liquidationAddressMap[networkId]
  }

  public getProtocolFetcherAddress(): string {
    return this.config.protocolFetcherProxyAddress
  }
}

// Create singleton instance
export const config = new Config()
