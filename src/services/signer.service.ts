import { JsonRpcProvider } from 'ethers'

import { routerService } from './router.service'

import { config } from '../config'
import { Signer__factory } from '../contracts'

export class SignerService {
  private readonly provider: JsonRpcProvider
  private readonly routerService = routerService

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())
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
