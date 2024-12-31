export type Environment = 'development' | 'staging'

export interface EnvironmentConfig {
  solverUrl: string
  backendUrl: string
  rpcUrl: string
  routerAddress: string
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    solverUrl: 'http://52.221.184.2',
    backendUrl: 'https://api-dev.bitdex.xyz',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: '0x67d96Bbd0Dd191525510163D753bA3FdE485f0ee',
  },
  staging: {
    solverUrl: 'http://52.221.184.2',
    backendUrl: 'https://api-stg.bitdex.xyz',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: '0x67d96Bbd0Dd191525510163D753bA3FdE485f0ee',
  },
}

class Config {
  private readonly env: Environment
  private readonly config: EnvironmentConfig

  constructor() {
    this.env = (process.env.SDK_ENV as Environment) || 'staging'

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
}

// Create singleton instance
const config = new Config()

// Freeze the configuration to prevent modifications
Object.freeze(config)

export default config
