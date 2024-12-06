export type Environment = 'development'

export interface EnvironmentConfig {
  solverUrl: string
  backendUrl: string
}

export interface AppConfig extends EnvironmentConfig {
  env: Environment
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    solverUrl: 'http://52.221.184.2',
    backendUrl: 'https://api-dev.bitfi.xyz',
  },
}

class Config {
  private readonly env: Environment
  private readonly config: EnvironmentConfig

  constructor() {
    const nodeEnv = (process.env.NODE_ENV as Environment) || 'development'

    if (!environments[nodeEnv]) {
      throw new Error(`Unsupported environment: ${nodeEnv}`)
    }

    this.env = nodeEnv
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
}

// Create singleton instance
const config = new Config()

// Freeze the configuration to prevent modifications
Object.freeze(config)

export default config
