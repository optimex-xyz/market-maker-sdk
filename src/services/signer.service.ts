import { JsonRpcProvider } from 'ethers'

import { routerService } from './router.service'

import { AppConfig, config, ConfigObserver } from '../config'
import { Signer__factory } from '../contracts'

export class SignerService implements ConfigObserver {
  private provider: JsonRpcProvider
  private readonly routerService = routerService

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())

    // Register as an observer
    config.registerObserver(this)
  }

  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(newConfig: AppConfig): void {
    this.provider = new JsonRpcProvider(newConfig.rpcUrl)
  }

  async getDomain() {
    const signerAddress = await this.routerService.getSigner()

    const contract = Signer__factory.connect(signerAddress, this.provider)

    const domain = await contract.eip712Domain()

    return {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    }
  }
}

// Export a singleton instance
export const signerService = new SignerService()
