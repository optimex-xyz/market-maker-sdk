import { BytesLike, JsonRpcProvider } from 'ethers'

import { protocolService } from './protocol.service'

import { AppConfig, config, ConfigObserver } from '../config'
import { ITypes, Router__factory } from '../contracts'

export class RouterService implements ConfigObserver {
  private provider: JsonRpcProvider
  private contract: ReturnType<typeof Router__factory.connect> | null = null

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())

    // Register as an observer
    config.registerObserver(this)
  }

  onConfigUpdate(newConfig: AppConfig): void {
    this.provider = new JsonRpcProvider(newConfig.rpcUrl)
    // Reset contract to null so it will be re-initialized with new config
    // This ensures router address is fetched again from protocolService with updated config
    this.contract = null
  }

  /**
   * Force refresh the contract instance
   * Useful when router address might have changed
   */
  public refreshContract(): void {
    this.contract = null
  }

  private async getContract() {
    if (!this.contract) {
      const routerAddress = await protocolService.getRouter()
      this.contract = Router__factory.connect(routerAddress, this.provider)
    }
    return this.contract
  }

  async getSigner(): Promise<string> {
    const contract = await this.getContract()
    return await contract.SIGNER()
  }

  async getHandler(fromChain: BytesLike, toChain: BytesLike): Promise<[string, string]> {
    const contract = await this.getContract()
    return await contract.getHandler(fromChain, toChain)
  }

  async getPMMSelection(tradeId: BytesLike): Promise<ITypes.PMMSelectionStructOutput> {
    const contract = await this.getContract()
    return await contract.getPMMSelection(tradeId)
  }

  async getSettlementPresigns(tradeId: BytesLike): Promise<ITypes.SettlementPresignStructOutput[]> {
    const contract = await this.getContract()
    return await contract.getSettlementPresigns(tradeId)
  }

  async getFeeDetails(tradeId: BytesLike): Promise<ITypes.FeeDetailsStructOutput> {
    const contract = await this.getContract()
    return await contract.getFeeDetails(tradeId)
  }

  async getTradeData(tradeId: BytesLike): Promise<ITypes.TradeDataStructOutput> {
    const contract = await this.getContract()
    return await contract.getTradeData(tradeId)
  }

  async getManagement(): Promise<string> {
    const contract = await this.getContract()
    return await contract.management()
  }
}

// Export a singleton instance
export const routerService = new RouterService()
