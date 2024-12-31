import { JsonRpcProvider } from 'ethers'

import config from '../config/config'
import { Signer__factory } from '../contracts'

export class SignerService {
  private readonly provider: JsonRpcProvider

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())
  }

  async getDomain(signerAddress: string) {
    const contract = Signer__factory.connect(signerAddress, this.provider)

    return await contract.eip712Domain()
  }
}

// Export a singleton instance
export const signerService = new SignerService()
