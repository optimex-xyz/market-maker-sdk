import { ethers, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers'

import { AppConfig, config, ConfigObserver } from '../config'
import { ITypes, ProtocolFetcherProxy__factory } from '../contracts'
import { ContractRole, L2ContractRole, OptimexEvmNetwork, OptimexL2Network } from '../shared'

export class ProtocolService implements ConfigObserver {
  private provider: JsonRpcProvider
  private contract: ReturnType<typeof ProtocolFetcherProxy__factory.connect>
  public l2Network: OptimexL2Network

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())
    this.contract = ProtocolFetcherProxy__factory.connect(config.getProtocolFetcherAddress(), this.provider)
    this.l2Network = config.isTestnet() ? OptimexL2Network.Testnet : OptimexL2Network.Mainnet

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
    this.l2Network = newConfig.isTestnet ? OptimexL2Network.Testnet : OptimexL2Network.Mainnet
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

  async getRouter(): Promise<string> {
    return this.contract.router()
  }

  async getAssetChainConfig(network: OptimexEvmNetwork, role: ContractRole) {
    const hashRole = keccak256(toUtf8Bytes([network, role].join(':')))
    return this.contract.getRoleMembers(hashRole)
  }

  async getL2Config(role: L2ContractRole) {
    const hashRole = keccak256(toUtf8Bytes([this.l2Network, role].join(':')))
    return this.contract.getRoleMembers(hashRole)
  }
}

// Export a singleton instance
export const protocolService = new ProtocolService()
