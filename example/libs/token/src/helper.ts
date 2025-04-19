export function normalizeSymbol(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case 'TBTC':
      return 'BTC'
    case 'WETH':
      return 'ETH'
    case 'WSOL':
      return 'SOL'
    default:
      return symbol
  }
}
