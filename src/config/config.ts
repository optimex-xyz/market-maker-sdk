export type Environment = 'development'

export interface EnvironmentConfig {
  solverUrl: string
  backendUrl: string
  rpcUrl: string
  routerAddress: string
  evmPrivateKey: string
  btcPrivateKey: string
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    solverUrl: 'http://52.221.184.2',
    backendUrl: 'https://api-dev.bitfi.xyz',
    rpcUrl: 'https://bitfi-ledger-testnet.alt.technology',
    routerAddress: process.env.ROUTER_ADDRESS || '',
    evmPrivateKey: process.env.PMM_EVM_PRIVATE_KEY || '',
    btcPrivateKey: process.env.PMM_BTC_PRIVATE_KEY || '',
  },
}

class Config {
  private readonly env: Environment
  private readonly config: EnvironmentConfig

  constructor() {
    this.env = (process.env.NODE_ENV as Environment) || 'development'

    if (!environments[this.env]) {
      throw new Error(`Unsupported environment: ${this.env}`)
    }

    this.config = environments[this.env]

    // Validate required environment variables
    this.validateConfig()
  }

  private validateConfig() {
    if (!this.config.evmPrivateKey) {
      throw new Error('PMM_EVM_PRIVATE_KEY is required')
    }
    if (!this.config.btcPrivateKey) {
      throw new Error('PMM_BTC_PRIVATE_KEY is required')
    }
    if (!this.config.routerAddress) {
      throw new Error('ROUTER_ADDRESS is required')
    }
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

  public getEvmPrivateKey(): string {
    return this.config.evmPrivateKey
  }

  public getBtcPrivateKey(): string {
    return this.config.btcPrivateKey
  }
}

// Create singleton instance
const config = new Config()

// Freeze the configuration to prevent modifications
Object.freeze(config)

export default config
