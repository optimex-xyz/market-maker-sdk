import { config, Environment } from './config'

export class SDK {
  /**
   * Change the environment after initialization
   * @param env The environment to use ('dev' or 'production')
   */
  setEnvironment(env: Environment): void {
    config.setEnvironment(env)
  }

  /**
   * Get the current environment configuration
   * @returns The current environment configuration
   */
  getConfig() {
    return config.get()
  }
}

// Export a default instance of the SDK
export const sdk = new SDK()
