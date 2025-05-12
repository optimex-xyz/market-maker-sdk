export type Environment = 'dev' | 'prelive' | 'production' | 'staging'

export interface EnvironmentConfig {
  backendUrl: string
  rpcUrl: string
  routerAddress: string
  paymentAddressMap: Record<string, string>
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

export interface ConfigObserver {
  onConfigUpdate(newConfig: AppConfig): void
}

const environments: Record<Environment, EnvironmentConfig> = {
  dev: {
    backendUrl: 'https://api-dev.bitdex.xyz',
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    routerAddress: '0x193501E5F72a42DACCF8Eb1C4AB37561c213309D',
    paymentAddressMap: {
      ethereum_sepolia: '0x1d8b58438D5Ccc8Fcb4b738C89078f7b4168C9c0',
    },
  },
  staging: {
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    routerAddress: '0x193501E5F72a42DACCF8Eb1C4AB37561c213309D',
    paymentAddressMap: {
      ethereum_sepolia: '0x7387DcCfE2f1D5F80b4ECDF91eF58541517e90D2',
    },
  },
  prelive: {
    backendUrl: 'https://pre-api.optimex.xyz',
    rpcUrl: 'https://rpc.optimex.xyz',
    routerAddress: '0xcceAb862dD41f6691d81Cc016216Cd45d7BD6D4A',
    paymentAddressMap: {
      ethereum: '0x0A497AC4261E37FA4062762C23Cf3cB642C839b8',
    },
  },
  production: {
    backendUrl: 'https://api.optimex.xyz',
    rpcUrl: 'https://rpc.optimex.xyz',
    routerAddress: '0xcceAb862dD41f6691d81Cc016216Cd45d7BD6D4A',
    paymentAddressMap: {
      ethereum: '0x0A497AC4261E37FA4062762C23Cf3cB642C839b8',
    },
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

  public getRouterAddress(): string {
    return this.config.routerAddress
  }

  public getPaymentAddress(networkId: string): string | undefined {
    return this.config.paymentAddressMap[networkId]
  }
}

// Create singleton instance
export const config = new Config()
