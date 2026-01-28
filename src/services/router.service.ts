import { getContract, type Hex } from 'viem'

import { protocolService } from './protocol.service'

import { routerAbi } from '../abi'
import { AppConfig, config, ConfigObserver } from '../config'
import type {
  AffiliateInfoStructOutput,
  FeeDetailsStructOutput,
  PMMSelectionStructOutput,
  SettlementPresignStructOutput,
  TradeDataStructOutput,
} from '../types/contract'
import { viemClient } from '../viem'

export class RouterService implements ConfigObserver {
  private routerAddress: `0x${string}` | null = null

  constructor() {
    // Register as an observer
    config.registerObserver(this)
  }

  onConfigUpdate(_newConfig: AppConfig): void {
    // Reset contract address to null so it will be re-initialized with new config
    // This ensures router address is fetched again from protocolService with updated config
    this.routerAddress = null
  }

  /**
   * Force refresh the contract instance
   * Useful when router address might have changed
   */
  public refreshContract(): void {
    this.routerAddress = null
  }

  private async getContract() {
    if (!this.routerAddress) {
      const address = await protocolService.getRouter()
      this.routerAddress = address as `0x${string}`
    }

    return getContract({
      address: this.routerAddress,
      abi: routerAbi,
      client: viemClient.getClient(),
    })
  }

  async getSigner(): Promise<string> {
    const contract = await this.getContract()
    return await contract.read.SIGNER()
  }

  async getHandler(fromChain: Hex, toChain: Hex): Promise<[string, string]> {
    const contract = await this.getContract()
    const result = await contract.read.getHandler([fromChain, toChain])
    return result as [string, string]
  }

  async getPMMSelection(tradeId: Hex): Promise<PMMSelectionStructOutput> {
    const contract = await this.getContract()
    return (await contract.read.getPMMSelection([tradeId])) as PMMSelectionStructOutput
  }

  async getSettlementPresigns(tradeId: Hex): Promise<SettlementPresignStructOutput[]> {
    const contract = await this.getContract()
    return (await contract.read.getSettlementPresigns([tradeId])) as SettlementPresignStructOutput[]
  }

  async getFeeDetails(tradeId: Hex): Promise<FeeDetailsStructOutput> {
    const contract = await this.getContract()
    return (await contract.read.getFeeDetails([tradeId])) as FeeDetailsStructOutput
  }

  async getTradeData(tradeId: Hex): Promise<TradeDataStructOutput> {
    const contract = await this.getContract()
    return (await contract.read.getTradeData([tradeId])) as TradeDataStructOutput
  }

  async getManagement(): Promise<string> {
    const contract = await this.getContract()
    return await contract.read.management()
  }

  async getAffiliateInfo(tradeId: Hex): Promise<AffiliateInfoStructOutput> {
    const contract = await this.getContract()
    return (await contract.read.getAffiliateInfo([tradeId])) as AffiliateInfoStructOutput
  }
}

// Export a singleton instance
export const routerService = new RouterService()
