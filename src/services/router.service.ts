import { BytesLike, ethers, JsonRpcProvider } from 'ethers'

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

  async getCurrentPubkey(network: string): Promise<ITypes.MPCInfoStructOutput> {
    return this.contract.getLatestMPCInfo(ethers.toUtf8Bytes(network))
  }

  async getCurrentStage(tradeId: BytesLike): Promise<bigint> {
    return await this.contract.getCurrentStage(tradeId)
  }

  async getDepositAddressList(tradeId: BytesLike): Promise<BytesLike[]> {
    return await this.contract.getDepositAddressList(tradeId)
  }

  async getHandler(fromChain: BytesLike, toChain: BytesLike): Promise<[string, string]> {
    return await this.contract.getHandler(fromChain, toChain)
  }

  async getPFeeRate(): Promise<bigint> {
    return await this.contract.getPFeeRate()
  }

  async getPMMSelection(tradeId: BytesLike): Promise<ITypes.PMMSelectionStructOutput> {
    return await this.contract.getPMMSelection(tradeId)
  }

  async getSettlementPresigns(tradeId: BytesLike): Promise<ITypes.SettlementPresignStructOutput[]> {
    return await this.contract.getSettlementPresigns(tradeId)
  }

  async getRefundPresigns(tradeId: BytesLike): Promise<ITypes.RefundPresignStructOutput> {
    return await this.contract.getRefundPresigns(tradeId)
  }

  async getProtocolState(): Promise<bigint> {
    return await this.contract.getProtocolState()
  }

  async getFeeDetails(tradeId: BytesLike): Promise<ITypes.FeeDetailsStructOutput> {
    return await this.contract.getFeeDetails(tradeId)
  }

  async getSettledPayment(tradeId: BytesLike): Promise<ITypes.SettledPaymentStructOutput> {
    return await this.contract.getSettledPayment(tradeId)
  }

  async getTokens(fromIdx: bigint, toIdx: bigint): Promise<ITypes.TokenInfoStructOutput[]> {
    return await this.contract.getTokens(fromIdx, toIdx)
  }

  async getTradeData(tradeId: BytesLike): Promise<ITypes.TradeDataStructOutput> {
    return await this.contract.getTradeData(tradeId)
  }

  async isMPCNode(account: string): Promise<boolean> {
    return await this.contract.isMPCNode(account)
  }

  async isSolver(account: string): Promise<boolean> {
    return await this.contract.isSolver(account)
  }

  async isSuspended(stage: bigint): Promise<boolean> {
    return await this.contract.isSuspended(stage)
  }

  async isValidNetwork(networkId: BytesLike): Promise<boolean> {
    return await this.contract.isValidNetwork(networkId)
  }

  async isValidPMM(pmmId: BytesLike): Promise<boolean> {
    return await this.contract.isValidPMM(pmmId)
  }

  async isValidPMMAccount(pmmId: BytesLike, account: string): Promise<boolean> {
    return await this.contract.isValidPMMAccount(pmmId, account)
  }

  async isValidToken(networkId: BytesLike, tokenId: BytesLike): Promise<boolean> {
    return await this.contract.isValidToken(networkId, tokenId)
  }

  async getManagement(): Promise<string> {
    return await this.contract.management()
  }

  async getNumOfSupportedTokens(): Promise<bigint> {
    return await this.contract.numOfSupportedTokens()
  }

  async getVersion(address: string): Promise<bigint> {
    return await this.contract.version(address)
  }
}

// Export a singleton instance
export const routerService = new RouterService()
