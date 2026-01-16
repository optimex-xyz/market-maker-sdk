import { getContract } from 'viem'

import { routerService } from './router.service'

import { signerAbi } from '../abi'
import { AppConfig, config, ConfigObserver } from '../config'
import { viemClient } from '../viem'

export class SignerService implements ConfigObserver {
  private readonly routerService = routerService

  constructor() {
    // Register as an observer
    config.registerObserver(this)
  }

  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(_newConfig: AppConfig): void {
    // No state to update - using viemClient which handles config updates
  }

  async getDomain() {
    const signerAddress = await this.routerService.getSigner()

    const contract = getContract({
      address: signerAddress as `0x${string}`,
      abi: signerAbi,
      client: viemClient.getClient(),
    })

    const domain = await contract.read.eip712Domain()

    return {
      name: domain[1],
      version: domain[2],
      chainId: domain[3],
      verifyingContract: domain[4],
    }
  }
}

// Export a singleton instance
export const signerService = new SignerService()
