import { config, Environment } from './config'

export class SDK {
  /**
   * Initialize the SDK with a specific environment
   * @param env The environment to use ('dev' or 'production')
   */
  setEnvironment(env: Environment): void {
    config.setEnvironment(env)
  }
}

// Export a default instance of the SDK
export const sdk = new SDK()
