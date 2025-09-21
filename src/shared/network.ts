export enum OptimexEvmNetwork {
  EthereumSepolia = 'ethereum_sepolia',
  EthereumMainnet = 'ethereum',
  BaseTestnet = 'base_sepolia',
  BaseMainnet = 'base',
  ArbitrumSepolia = 'arbitrum_sepolia',
  Arbitrum = 'arbitrum',
  OptimismSepolia = 'optimism_sepolia',
  Optimism = 'optimism',
  BSC = 'bsc',
}

export enum OptimexL2Network {
  Testnet = 'optimex_testnet',
  Mainnet = 'optimex',
}

export enum OptimexBtcNetwork {
  BitcoinTestnet = 'bitcoin_testnet',
  BitcoinMainnet = 'bitcoin',
}

export enum OptimexSolanaNetwork {
  SolanaDevnet = 'solana_devnet',
  SolanaMainnet = 'solana',
}

export enum OptimexLendingNetwork {
  Morpho = 'MORPHO',
}

export type UnknownNetwork = ''

export type OptimexNetwork =
  | OptimexEvmNetwork
  | OptimexBtcNetwork
  | OptimexSolanaNetwork
  | OptimexL2Network
  | OptimexLendingNetwork
  | ''

export const isEvmNetwork = (network: OptimexNetwork): network is OptimexEvmNetwork => {
  return Object.values<string>(OptimexEvmNetwork).includes(network)
}

export const isBtcNetwork = (network: OptimexNetwork): network is OptimexBtcNetwork => {
  return Object.values<string>(OptimexBtcNetwork).includes(network)
}

export const isSolanaNetwork = (network: OptimexNetwork): network is OptimexSolanaNetwork => {
  return Object.values<string>(OptimexSolanaNetwork).includes(network)
}

export const isL2Network = (network: OptimexNetwork): network is OptimexL2Network => {
  return Object.values<string>(OptimexL2Network).includes(network)
}
