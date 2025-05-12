import { BytesLike, JsonRpcProvider } from 'ethers'

import { AppConfig, config, ConfigObserver } from '../config'
import { ITypes, Router__factory } from '../contracts'

export class RouterService implements ConfigObserver {
  private provider: JsonRpcProvider
  private contract: ReturnType<typeof Router__factory.connect>

  constructor() {
    this.provider = new JsonRpcProvider(config.getRpcUrl())
    this.contract = Router__factory.connect(config.getRouterAddress(), this.provider)

    // Register as an observer
    config.registerObserver(this)
  }
  /**
   * Implementation of ConfigObserver interface
   * Updates service when config changes
   */
  onConfigUpdate(newConfig: AppConfig): void {
    this.provider = new JsonRpcProvider(newConfig.rpcUrl)
    this.contract = Router__factory.connect(newConfig.routerAddress, this.provider)
  }

  async getSigner(): Promise<string> {
    return await this.contract.SIGNER()
  }

  async getHandler(fromChain: BytesLike, toChain: BytesLike): Promise<[string, string]> {
    return await this.contract.getHandler(fromChain, toChain)
  }

  async getPMMSelection(tradeId: BytesLike): Promise<ITypes.PMMSelectionStructOutput> {
    return await this.contract.getPMMSelection(tradeId)
  }

  async getSettlementPresigns(tradeId: BytesLike): Promise<ITypes.SettlementPresignStructOutput[]> {
    return await this.contract.getSettlementPresigns(tradeId)
  }

  async getFeeDetails(tradeId: BytesLike): Promise<ITypes.FeeDetailsStructOutput> {
    return await this.contract.getFeeDetails(tradeId)
  }

  async getTradeData(tradeId: BytesLike): Promise<ITypes.TradeDataStructOutput> {
    return await this.contract.getTradeData(tradeId)
  }

  async getManagement(): Promise<string> {
    return await this.contract.management()
  }
}

// Export a singleton instance
export const routerService = new RouterService()
