# PetaFi Market Maker SDK

## Overview
PetaFi Market Maker SDK is a TypeScript library that provides a comprehensive interface for interacting with the PetaFi decentralized trading platform. The SDK facilitates cross-chain token transfers, signature verification, and trade settlements, with built-in support for both EVM and Bitcoin networks.

## Features
- Cross-chain token transfers and settlements
- Comprehensive signature utilities
- Token management and information retrieval
- Router contract interactions
- Solver service integration
- Type-safe implementation with TypeScript
- Built-in error handling and validation

## Installation

```bash
npm install @petafixyz/market-maker-sdk
# or
yarn add @petafixyz/market-maker-sdk
```

## Services

### RouterService
Handles interactions with the PetaFi router contract:

```typescript
import { routerService } from '@petafixyz/market-maker-sdk';

// Get contract information
const signer = await routerService.getSigner();
const currentPubkey = await routerService.getCurrentPubkey();

// Trade management
const currentStage = await routerService.getCurrentStage(tradeId);
const tradeData = await routerService.getTradeData(tradeId);

// Handler and token information
const handler = await routerService.getHandler(fromChain, toChain);
const tokens = await routerService.getTokens(fromIdx, toIdx);
```

### SolverService
Manages settlement transaction submissions:

```typescript
import { solverService } from '@petafixyz/market-maker-sdk';

// Single settlement
await solverService.submitSingleSettlement(
  tradeId,
  pmmId,
  settlementTx,
  signature,
  timestamp
);

// Batch settlement
await solverService.submitBatchSettlement(
  tradeIds,
  pmmId,
  settlementTx,
  signature,
  startIndex,
  timestamp
);
```

### TokenService
Provides token information and management:

```typescript
import { tokenService } from '@petafixyz/market-maker-sdk';

// Retrieve token information
const allTokens = await tokenService.getTokens();
const token = await tokenService.getTokenByTokenId(tokenId);
const networkTokens = await tokenService.getTokensByNetwork(networkId);
const specificToken = await tokenService.getToken(networkId, tokenAddress);
```

## Signature Utilities

The SDK includes comprehensive signature utilities:

```typescript
import {
  getSignature,
  SignatureType,
  getInfoHash
} from '@petafixyz/market-maker-sdk';

// Generate signatures
const signature = await getSignature(
  signer,
  provider,
  signerHelper,
  tradeId,
  infoHash,
  SignatureType.Presign  // update type signature
);

// Generate various info hashes
const presignHash = getInfoHash.getPresignHash(pmmRecvAddress, amountIn);
const depositHash = getInfoHash.getDepositConfirmationHash(
  amountIn,
  fromChain,
  depositTxId,
  depositFromList
);
```

## Best Practices

1. Always validate input data before making service calls
2. Implement proper error handling for all operations
3. Keep private keys secure and never expose them in code
4. Monitor transaction status after submitting settlements
5. Use TypeScript for better type safety
6. Regularly update to the latest SDK version
7. Use environment variables for configuration
8. Test thoroughly before deploying to production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and feature requests, please open an issue on GitHub.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
