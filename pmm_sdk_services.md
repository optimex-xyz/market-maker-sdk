# Market Maker SDK

## Overview
Market Maker SDK is a TypeScript library that provides a comprehensive interface for interacting with the decentralized trading platform. The SDK facilitates cross-chain token transfers, signature verification, and trade settlements, with built-in support for both EVM and Bitcoin networks.

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
npm install @optimex-xyz/market-maker-sdk
# or
yarn add @optimex-xyz/market-maker-sdk
```

## Services

### RouterService
Handles interactions with the router contract:

```typescript
import { routerService } from '@optimex-xyz/market-maker-sdk';

// Get contract information
const signer = await routerService.getSigner();
const currentPubkey = await routerService.getCurrentPubkey(network);

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
import { solverService } from '@optimex-xyz/market-maker-sdk';

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
import { tokenService } from '@optimex-xyz/market-maker-sdk';

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
} from '@optimex-xyz/market-maker-sdk';

// Generate signatures
const signature = await getSignature(
  signer,
  provider,
  signerHelper,
  tradeId,
  infoHash,
  SignatureType.Presign  // update type signature
);

```
