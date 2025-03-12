export type Environment = 'dev' | 'production'

export interface EnvironmentConfig {
  backendUrl: string
  rpcUrl: string
  routerAddress: string
  paymentAddressMap: Record<string, string>
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

const environments: Record<Environment, EnvironmentConfig> = {
  dev: {
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    routerAddress: '0xc0B01A53B15bacAF6f81aF1F6B001E8c8130256e',
    paymentAddressMap: {
      ethereum_sepolia: '0x7387DcCfE2f1D5F80b4ECDF91eF58541517e90D2',
    },
  },
  production: {
    backendUrl: 'https://api.petafi.xyz',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: '0x272599CE3602A49B580A5C4a4d3C1067E30248D2',
    paymentAddressMap: {
      ethereum: 'x0A497AC4261E37FA4062762C23Cf3cB642C839b8',
    },
  },
}

class Config {
  private env: Environment
  private config: EnvironmentConfig

  constructor(env: Environment = 'production') {
    this.env = env
    this.config = this.validateAndGetConfig(this.env)
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
