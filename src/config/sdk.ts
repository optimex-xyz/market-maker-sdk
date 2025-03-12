import { config, Environment } from './config'

export class SDK {
  /**
   * Change the environment after initialization
   * @param env The environment to use ('dev' or 'production')
   */
  setEnvironment(env: Environment): void {
    config.setEnvironment(env)
  }
}

// Export a default instance of the SDK with production environment
export const sdk = new SDK()
