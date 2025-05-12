import { ethers, JsonRpcProvider } from 'ethers'

import { AppConfig, config, ConfigObserver } from '../config'
import { ITypes, ProtocolFetcherProxy__factory } from '../contracts'

export class ProtocolService implements ConfigObserver {
  private provider: JsonRpcProvider
  private contract: ReturnType<typeof ProtocolFetcherProxy__factory.connect>

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())
    this.contract = ProtocolFetcherProxy__factory.connect(config.getProtocolFetcherAddress(), this.provider)

    // Register as an observer
    config.registerObserver(this)
  }
  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(newConfig: AppConfig): void {
    this.provider = new JsonRpcProvider(newConfig.rpcUrl)
    this.contract = ProtocolFetcherProxy__factory.connect(newConfig.protocolFetcherProxyAddress, this.provider)
  }

  async getCurrentPubkey(network: string): Promise<ITypes.MPCInfoStructOutput> {
    return this.contract.getLatestMPCInfo(ethers.toUtf8Bytes(network))
  }

  async getPFeeRate({
    fromNetworkId,
    fromTokenId,
    toNetworkId,
    toTokenId,
  }: {
    fromNetworkId: string
    fromTokenId: string
    toNetworkId: string
    toTokenId: string
  }): Promise<number> {
    const feeRate = await this.contract.getPFeeRate([
      ethers.toUtf8Bytes(fromNetworkId),
      ethers.toUtf8Bytes(fromTokenId),
      ethers.toUtf8Bytes(toNetworkId),
      ethers.toUtf8Bytes(toTokenId),
    ])
    return Number(feeRate.toString())
  }
}

// Export a singleton instance
export const protocolService = new ProtocolService()
