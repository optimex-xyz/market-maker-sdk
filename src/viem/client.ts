import { createPublicClient, http, type HttpTransport } from 'viem'

import { AppConfig, config, ConfigObserver } from '../config'

export type ViemPublicClient = ReturnType<typeof createPublicClient<HttpTransport>>

/**
 * Creates a viem PublicClient for the given RPC URL
 * No chain definition needed - just transport
 */
export function createViemClient(rpcUrl: string): ViemPublicClient {
  return createPublicClient({
    transport: http(rpcUrl),
  })
}

/**
 * Singleton PublicClient manager that responds to config changes
 * Replaces ethers JsonRpcProvider usage in services
 */
class ViemClientManager implements ConfigObserver {
  private client: ViemPublicClient

  constructor() {
    this.client = createViemClient(config.getRpcUrl())
    config.registerObserver(this)
  }

  onConfigUpdate(newConfig: AppConfig): void {
    this.client = createViemClient(newConfig.rpcUrl)
  }

  getClient(): ViemPublicClient {
    return this.client
  }
}

export const viemClient = new ViemClientManager()
