import { BTCTransferStrategy, EVMTransferStrategy } from './stategies';
import { ITransferStrategy } from './transfer-strategy.interface';

export class TransferFactory {
  private strategies = new Map<string, ITransferStrategy>()

  constructor() {
    const evmStrategy = new EVMTransferStrategy()
    const btcStrategy = new BTCTransferStrategy()

    // Register strategies
    this.strategies.set('EVM', evmStrategy)
    this.strategies.set('TBTC', btcStrategy)
    this.strategies.set('BTC', btcStrategy)
  }

  getStrategy(networkType: string): ITransferStrategy {
    const strategy = this.strategies.get(networkType.toUpperCase())
    if (!strategy) {
      throw new Error(`Unsupported network type: ${networkType}`)
    }
    return strategy
  }
}
