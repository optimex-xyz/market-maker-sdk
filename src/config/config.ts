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
    solverUrl: 'http://example.com',
    backendUrl: 'https://example.com',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: '0x67d96Bbd0Dd191525510163D753bA3FdE485f0ee',
    paymentAddressMap: {
      'ethereum-sepolia': '0x40b1C28197be3016D0db9Bad5efaF415244f0A73',
    },
  },
  production: {
    solverUrl: 'https://bitfi-solver.kyberengineering.io',
    backendUrl: 'https://api.bitfi.xyz',
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
