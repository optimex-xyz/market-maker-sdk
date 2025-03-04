export type Environment = 'dev' | 'production'

export interface EnvironmentConfig {
  solverUrl: string
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
    solverUrl: 'https://pre-bitfi-solver.kyberengineering.io',
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://rpc-bitfi-p00c4t1rul.t.conduit.xyz',
    routerAddress: '0xc0B01A53B15bacAF6f81aF1F6B001E8c8130256e',
    paymentAddressMap: {
      'ethereum_sepolia': '0x7387DcCfE2f1D5F80b4ECDF91eF58541517e90D2',
    },
  },
  production: {
    solverUrl: 'https://bitfi-solver.kyberengineering.io',
    backendUrl: 'https://api.petafi.xyz',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: '0x07468dF194817257e73cA71E938C1ef977Be032F',
    paymentAddressMap: {
      ethereum: '0x05d60d78ec4896c041268b68fcef2294b16123c3',
    },
  },
}

class Config {
  private readonly env: Environment
  private readonly config: EnvironmentConfig

  constructor() {
    this.env = (process.env.SDK_ENV as Environment) || 'production'

    if (!environments[this.env]) {
      throw new Error(`Unsupported environment: ${this.env}`)
    }

    this.config = environments[this.env]
  }

  public get(): AppConfig {
    return {
      env: this.env,
      ...this.config,
    }
  }

  public getSolverUrl(): string {
    return this.config.solverUrl
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
