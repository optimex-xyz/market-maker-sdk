import { getContract, keccak256, stringToHex } from 'viem'

import { protocolFetcherProxyAbi } from '../abi'
import { AppConfig, config, ConfigObserver } from '../config'
import { AssetChainContractRole, L2ContractRole, OptimexEvmNetwork, OptimexL2Network } from '../shared'
import type { MPCInfoStructOutput } from '../types/contract'
import { viemClient } from '../viem'

export class ProtocolService implements ConfigObserver {
  private protocolFetcherAddress: `0x${string}`
  public l2Network: OptimexL2Network

  constructor() {
    this.protocolFetcherAddress = config.getProtocolFetcherAddress() as `0x${string}`
    this.l2Network = config.isTestnet() ? OptimexL2Network.Testnet : OptimexL2Network.Mainnet

    // Register as an observer
    config.registerObserver(this)
  }

  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(newConfig: AppConfig): void {
    this.protocolFetcherAddress = newConfig.protocolFetcherProxyAddress as `0x${string}`
    this.l2Network = newConfig.isTestnet ? OptimexL2Network.Testnet : OptimexL2Network.Mainnet
  }

  private getContract() {
    return getContract({
      address: this.protocolFetcherAddress,
      abi: protocolFetcherProxyAbi,
      client: viemClient.getClient(),
    })
  }

  async getCurrentPubkey(network: string): Promise<MPCInfoStructOutput> {
    const contract = this.getContract()
    return (await contract.read.getLatestMPCInfo([stringToHex(network)])) as MPCInfoStructOutput
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
    const contract = this.getContract()
    const feeRate = await contract.read.getPFeeRate([
      [stringToHex(fromNetworkId), stringToHex(fromTokenId), stringToHex(toNetworkId), stringToHex(toTokenId)],
    ])
    return Number(feeRate.toString())
  }

  async getRouter(): Promise<string> {
    const contract = this.getContract()
    return await contract.read.router()
  }

  async getAssetChainConfig(network: OptimexEvmNetwork, role: AssetChainContractRole) {
    const contract = this.getContract()
    const hashRole = keccak256(stringToHex([network, role].join(':')))
    return await contract.read.getRoleMembers([hashRole])
  }

  async getL2Config(role: L2ContractRole) {
    const contract = this.getContract()
    const hashRole = keccak256(stringToHex([this.l2Network, role].join(':')))
    return await contract.read.getRoleMembers([hashRole])
  }
}

// Export a singleton instance
export const protocolService = new ProtocolService()
