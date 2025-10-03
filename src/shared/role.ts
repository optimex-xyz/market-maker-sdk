export enum AssetChainContractRole {
  // AcrossAdapter = 'AcrossAdapter',
  AcrossTransitVault = 'AcrossTransitVault',
  // NativeVault = 'NativeVault',
  // TokenVault = 'TokenVault',
  Payment = 'OptimexSwapPayment',
  OptimexManagement = 'OptimexManagement',
  MorphoSupplier = 'MorphoSupplier',
  MorphoLiquidationGateway = 'MorphoLiquidationGateway',
  MorphoManagement = 'MorphoManagement',
}

export enum L2ContractRole {
  MorphoAdapter = 'MorphoAdapter',
  MorphoMarketRegistry = 'MorphoMarketRegistry',
  AcrossRefund = 'AcrossRefund',
}
