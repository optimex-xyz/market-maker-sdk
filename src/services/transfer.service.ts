import { tokenService, TokenService } from './token.service'
import { TransferFactory } from './transfer/transfer.factory'

export interface TransferParams {
  toAddress: string
  amount: bigint
  networkId: string
  tokenAddress: string
  tradeId: string
}

export class TransferService {
  private readonly tokenRepo: TokenService
  constructor(private readonly transferFactory: TransferFactory) {
    this.tokenRepo = tokenService
  }

  /**
   * Execute a token transfer using the appropriate strategy based on network type
   * @param params Transfer parameters including amount and destination
   * @returns Transaction hash of the transfer
   */
  async transfer(params: TransferParams): Promise<string> {
    try {
      const { toAddress, amount, networkId, tokenAddress, tradeId } = params

      console.log(
        `Initiating transfer to ${toAddress} of amount ${amount.toString()} on network ${networkId}`
      )

      // Get token information
      const token = await this.tokenRepo.getToken(networkId, tokenAddress)

      console.log(
        `Using ${token.networkType} transfer strategy for token ${token.tokenSymbol}`
      )

      // Get appropriate transfer strategy
      const strategy = this.transferFactory.getStrategy(token.networkType)

      // Execute transfer
      const txHash = await strategy.transfer({
        toAddress,
        amount,
        token,
        tradeId,
      })

      console.log(
        `Transfer completed successfully. Transaction hash: ${txHash}`
      )

      return txHash
    } catch (error) {
      console.error('Transfer failed:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const transferService = new TransferService(new TransferFactory())
