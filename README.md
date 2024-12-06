# BitFi Market Maker SDK

## Overview
BitFi Market Maker SDK is a TypeScript library that provides a comprehensive interface for interacting with the BitFi trading platform. It facilitates token transfers across different blockchain networks, handles signature verification, and manages trade settlements.

## Installation

```bash
npm install bitfi-market-maker-sdk
# or
yarn add bitfi-market-maker-sdk
```

## Features

- Cross-chain token transfers (EVM and BTC networks)
- Trade settlement management
- Token information retrieval
- Signature verification and generation
- Router contract interactions
- Advanced configuration management

## Configuration

The SDK requires several environment variables to be set:

```typescript
// Required Environment Variables
PMM_EVM_PRIVATE_KEY=<your-evm-private-key>
PMM_BTC_PRIVATE_KEY=<your-btc-private-key>
ROUTER_ADDRESS=<router-contract-address>
```

## Core Services

### 1. Transfer Service

The TransferService handles token transfers across different blockchain networks.

```typescript
import { transferService } from 'bitfi-market-maker-sdk';

// Example usage
await transferService.transfer({
  toAddress: '0x...',
  amount: BigInt('1000000000000000000'), // 1 token with 18 decimals
  networkId: 'ethereum-sepolia',
  tokenAddress: '0x...',
  tradeId: '0x...'
});
```

### 2. Token Service

The TokenService provides information about available tokens and their properties.

```typescript
import { tokenService } from 'bitfi-market-maker-sdk';

// Get all available tokens
const tokens = await tokenService.getTokens();

// Get token by network and address
const token = await tokenService.getToken('ethereum-sepolia', '0x...');

// Get tokens for a specific network
const networkTokens = await tokenService.getTokensByNetwork('ethereum-sepolia');
```

### 3. Solver Service

The SolverService handles trade settlement submissions.

```typescript
import { solverService } from 'bitfi-market-maker-sdk';

// Submit a single settlement
await solverService.submitSingleSettlement(
  'tradeId',
  'pmmId',
  'settlementTx',
  'signature'
);

// Submit batch settlements
await solverService.submitBatchSettlement(
  ['tradeId1', 'tradeId2'],
  'pmmId',
  'settlementTx',
  'signature'
);
```

### 4. Router Service

The RouterService provides interfaces for interacting with the BitFi router contract.

```typescript
import { routerService } from 'bitfi-market-maker-sdk';

// Get protocol fee
const fee = await routerService.getProtocolFee(tradeId);

// Check if network is valid
const isValid = await routerService.isValidNetwork(networkId);
```

## Supported Networks

### EVM Networks
- Ethereum (Mainnet)
- Ethereum Sepolia
- Base Sepolia

### Bitcoin Networks
- Bitcoin (Mainnet)
- Bitcoin Testnet

## Transfer Strategies

The SDK implements two main transfer strategies:

### 1. EVM Transfer Strategy
Handles transfers on EVM-compatible networks with features like:
- Native token transfers
- ERC20 token transfers
- Protocol fee handling
- Gas optimization

### 2. BTC Transfer Strategy
Manages Bitcoin transfers with features like:
- UTXO management
- Dynamic fee calculation
- Transaction signing
- OP_RETURN data inclusion

## Signature Utilities

The SDK provides comprehensive signature utilities for various operations:

```typescript
import { getSignature, SignatureType } from 'bitfi-market-maker-sdk';

// Generate signature
const signature = await getSignature(
  signer,
  provider,
  signerHelper,
  tradeId,
  infoHash,
  SignatureType.Presign
);
```

## Error Handling

The SDK implements comprehensive error handling. All services throw typed errors that can be caught and handled appropriately:

```typescript
try {
  await transferService.transfer({...});
} catch (error) {
  if (error instanceof Error) {
    console.error('Transfer failed:', error.message);
  }
}
```

## Best Practices

1. Always initialize services with proper configuration
2. Handle errors appropriately
3. Monitor transaction status after transfers
4. Validate addresses and amounts before transfers
5. Keep private keys secure
6. Use appropriate network endpoints for different environments

## Development Setup

```bash
# Install dependencies
npm install

# Generate TypeChain contracts
npm run typechain

# Generate index files
npm run ctix

# Build the package
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
