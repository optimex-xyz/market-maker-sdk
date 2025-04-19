import { Injectable } from '@nestjs/common'

import { ITransferStrategy } from '../interfaces/transfer-strategy.interface'
import { BTCTransferStrategy, EVMTransferStrategy, SolanaTransferStrategy } from '../strategies'

@Injectable()
export class TransferFactory {
  private strategies = new Map<string, ITransferStrategy>()

  constructor(
    private evmTransferStrategy: EVMTransferStrategy,
    private btcTransferStrategy: BTCTransferStrategy,
    private solanaTransferStrategy: SolanaTransferStrategy
  ) {
    this.strategies.set('EVM', evmTransferStrategy)
    this.strategies.set('TBTC', btcTransferStrategy)
    this.strategies.set('BTC', btcTransferStrategy)
    this.strategies.set('SOLANA', solanaTransferStrategy)
  }

  getStrategy(networkType: string): ITransferStrategy {
    const strategy = this.strategies.get(networkType)
    if (!strategy) {
      throw new Error(`Unsupported network type: ${networkType}`)
    }

    return strategy
  }
}
