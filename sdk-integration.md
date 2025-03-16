# PMM SDK Integration Guide

This document provides instructions for using the `@optimex-xyz/market-maker-sdk` package for PMM integration. The SDK offers convenient wrappers and utilities for interacting with the Solver network.

## Table of Contents

- [PMM SDK Integration Guide](#pmm-sdk-integration-guide)
  - [Table of Contents](#table-of-contents)
  - [1. Installation](#1-installation)
  - [2. Environment Setup](#2-environment-setup)
  - [3. SDK Functions for PMMs](#3-sdk-functions-for-pmms)
    - [3.1. Function: tokenService.getTokens](#31-function-tokenservicegettokens)
    - [3.2. Function: routerService.getTradeData](#32-function-routerservicegettradedata)
    - [3.3. Function: getCommitInfoHash](#33-function-getcommitinfohash)
    - [3.4. Function: getSignature](#34-function-getsignature)
    - [3.5. Function: getMakePaymentHash](#35-function-getmakepaymenthash)
    - [3.6. Function: solverService.submitSettlementTx](#36-function-solverservicesubmitsettlementtx)
    - [3.7. Function: routerService.getFeeDetails](#37-function-routerservicegetfeedetails)
  - [4. Implementation Examples](#4-implementation-examples)
    - [4.1. Getting Token Information](#41-getting-token-information)
    - [4.2. Generating Settlement Signatures](#42-generating-settlement-signatures)
    - [4.3. Submitting Settlement Transactions](#43-submitting-settlement-transactions)
    - [4.4. Making EVM Payments](#44-making-evm-payments)
    - [4.5. Making Bitcoin Payments](#45-making-bitcoin-payments)
  - [5. Error Handling](#5-error-handling)
  - [6. Advanced Configuration](#6-advanced-configuration)

## 1. Installation

```bash
npm install @optimex-xyz/market-maker-sdk
# or
yarn add @optimex-xyz/market-maker-sdk
```

## 2. Environment Setup

You can directly specify the environment for the SDK:

```typescript
import { sdk, Environment } from '@optimex-xyz/market-maker-sdk'

// Change to development environment
sdk.setEnvironment('dev' as Environment)

// Change to production environment
sdk.setEnvironment('production' as Environment)
```

## 3. SDK Functions for PMMs

### 3.1. Function: tokenService.getTokens

Returns a list of all supported tokens across different networks.

```typescript
import { tokenService } from '@optimex-xyz/market-maker-sdk'

// Get all tokens
const tokens = await tokenService.getTokens()

// Get token by ID
const token = await tokenService.getTokenByTokenId('ETH')
```

### 3.2. Function: routerService.getTradeData

Retrieves detailed trade data from the router contract or backend.

```typescript
import { routerService } from '@optimex-xyz/market-maker-sdk'

// Get trade data
const tradeData = await routerService.getTradeData('0xTradeID')
```

### 3.3. Function: getCommitInfoHash

Generates a hash of commitment information for signing.

```typescript
import { getCommitInfoHash } from '@optimex-xyz/market-maker-sdk'

const commitInfoHash = getCommitInfoHash(
  pmmId,
  pmmReceivingAddress,
  toChain,
  toTokenAddress,
  amountOut,
  deadline
)
```

### 3.4. Function: getSignature

Creates a signature for various purposes, including commitment and settlement.

```typescript
import { getSignature, SignatureType, signerService } from '@optimex-xyz/market-maker-sdk'

const domain = await signerService.getDomain()

const signature = await getSignature(
  pmmWallet,
  provider,
  signerAddress,
  tradeId,
  commitInfoHash,
  SignatureType.VerifyingContract,
  domain
)
```

### 3.5. Function: getMakePaymentHash

Creates a hash for the payment data to be signed.

```typescript
import { getMakePaymentHash } from '@optimex-xyz/market-maker-sdk'

const makePaymentInfoHash = getMakePaymentHash(
  tradeIds,
  signedAtTimestamp,
  startIdx,
  paymentTxId
)
```

### 3.6. Function: solverService.submitSettlementTx

Submits the settlement transaction to the Solver.

```typescript
import { solverService } from '@optimex-xyz/market-maker-sdk'

const response = await solverService.submitSettlementTx({
  tradeIds: [tradeId],
  pmmId: pmmId,
  settlementTx: paymentTxId,
  signature: signature,
  startIndex: 0,
  signedAt: signedAtTimestamp
})
```

### 3.7. Function: routerService.getFeeDetails

Gets fee details for a specific trade.

```typescript
import { routerService } from '@optimex-xyz/market-maker-sdk'

const feeDetails = await routerService.getFeeDetails(tradeId)
```

## 4. Implementation Examples

### 4.1. Getting Token Information

```typescript
import { tokenService } from '@optimex-xyz/market-maker-sdk'

async function getIndicativeQuote(dto) {
  const sessionId = dto.sessionId || this.generateSessionId()

  const [fromToken, toToken] = await Promise.all([
    tokenService.getTokenByTokenId(dto.fromTokenId),
    tokenService.getTokenByTokenId(dto.toTokenId),
  ])

  // Calculate quote based on token information
  const quote = calculateBestQuote(fromToken, toToken, dto.amount)

  return {
    sessionId,
    pmmReceivingAddress: getPmmAddress(fromToken.networkId),
    indicativeQuote: quote,
    error: '',
  }
}
```

### 4.2. Generating Settlement Signatures

```typescript
import {
  getCommitInfoHash,
  getSignature,
  routerService,
  SignatureType,
  signerService,
} from '@optimex-xyz/market-maker-sdk'

async function getSettlementSignature(dto, trade) {
  try {
    const { tradeId } = trade

    // Get data from router service
    const [presigns, tradeData] = await Promise.all([
      routerService.getPresigns(tradeId),
      routerService.getTradeData(tradeId),
    ])

    const { toChain } = tradeData.tradeInfo
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800)

    const pmmId = process.env.PMM_ID // Your PMM ID
    const pmmPresign = presigns.find((t) => t.pmmId === pmmId)
    
    if (!pmmPresign) {
      throw new Error('pmmPresign not found')
    }

    // Create hash with committed quote
    const amountOut = BigInt(dto.committedQuote)

    const commitInfoHash = getCommitInfoHash(
      pmmPresign.pmmId,
      pmmPresign.pmmRecvAddress,
      toChain[1],
      toChain[2],
      amountOut,
      deadline
    )

    const signerAddress = await routerService.getSigner()
    const domain = await signerService.getDomain()

    const signature = await getSignature(
      pmmWallet,
      provider,
      signerAddress,
      tradeId,
      commitInfoHash,
      SignatureType.VerifyingContract,
      domain
    )

    return {
      tradeId: tradeId,
      signature,
      deadline: Number(deadline),
      error: '',
    }
  } catch (error) {
    // Handle error
    return {
      tradeId: dto.tradeId,
      signature: '',
      deadline: 0,
      error: error.message,
    }
  }
}
```

### 4.3. Submitting Settlement Transactions

```typescript
import {
  getMakePaymentHash,
  getSignature,
  routerService,
  SignatureType,
  signerService,
  solverService,
  ensureHexPrefix
} from '@optimex-xyz/market-maker-sdk'

async function submitSettlement(tradeId, paymentTxId) {
  try {
    const tradeIds = [tradeId]
    const startIdx = BigInt(0)

    const signerAddress = await routerService.getSigner()
    const signedAt = Math.floor(Date.now() / 1000)

    const makePaymentInfoHash = getMakePaymentHash(
      tradeIds, 
      BigInt(signedAt), 
      startIdx, 
      ensureHexPrefix(paymentTxId)
    )

    const domain = await signerService.getDomain()

    const signature = await getSignature(
      pmmWallet,
      provider,
      signerAddress,
      tradeId,
      makePaymentInfoHash,
      SignatureType.MakePayment,
      domain
    )

    const pmmId = process.env.PMM_ID // Your PMM ID
    
    const requestPayload = {
      tradeIds: [tradeId],
      pmmId: pmmId,
      settlementTx: ensureHexPrefix(paymentTxId),
      signature: signature,
      startIndex: 0,
      signedAt: signedAt,
    }

    const response = await solverService.submitSettlementTx(requestPayload)
    return response
  } catch (error) {
    console.error('Submit settlement error', error.stack)
    throw error
  }
}
```

### 4.4. Making EVM Payments

```typescript
import { 
  config, 
  ensureHexPrefix, 
  ERC20__factory, 
  Payment__factory, 
  routerService 
} from '@optimex-xyz/market-maker-sdk'
import { ethers } from 'ethers'

async function makeEVMPayment(params) {
  const { toAddress, amount, token, tradeId } = params
  const { tokenAddress, networkId } = token

  // Get signer and provider
  const rpcUrl = getRpcUrlForNetwork(networkId)
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(process.env.PMM_EVM_PRIVATE_KEY, provider)

  // Get payment contract address
  const paymentAddress = config.getPaymentAddress(networkId)
  if (!paymentAddress) {
    throw new Error(`Unsupported networkId: ${networkId}`)
  }

  // Handle ERC20 allowance if needed
  if (tokenAddress !== 'native') {
    // Set allowance for ERC20 token
    const erc20Contract = ERC20__factory.connect(tokenAddress, signer)
    const allowance = await erc20Contract.allowance(signer.address, paymentAddress)
    
    if (allowance < amount) {
      const approveTx = await erc20Contract.approve(paymentAddress, amount * 2n)
      await approveTx.wait()
    }
  }

  // Connect to payment contract
  const paymentContract = Payment__factory.connect(paymentAddress, signer)

  // Get fee details for the trade
  const feeDetail = await routerService.getFeeDetails(tradeId)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60)

  // Submit payment transaction
  const tx = await paymentContract.payment(
    tradeId,
    tokenAddress === 'native' ? ethers.ZeroAddress : tokenAddress,
    toAddress,
    amount,
    feeDetail.totalAmount,
    deadline,
    {
      value: tokenAddress === 'native' ? amount : 0n,
    }
  )

  console.log(`Transfer transaction sent: ${tx.hash}`)
  return ensureHexPrefix(tx.hash)
}
```

### 4.5. Making Bitcoin Payments

```typescript
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import axios from 'axios'
import { getTradeIdsHash } from '@optimex-xyz/market-maker-sdk'

async function makeBitcoinPayment(params) {
  const { toAddress, amount, token, tradeId } = params
  const ECPair = ECPairFactory(ecc)
  
  // Set up Bitcoin library
  bitcoin.initEccLib(ecc)
  
  // Get network configuration
  const network = getNetwork(token.networkId)
  const rpcUrl = getRpcUrl(token.networkId)
  
  // Create keypair from private key
  const keyPair = ECPair.fromWIF(process.env.PMM_BTC_PRIVATE_KEY, network)
  const payment = bitcoin.payments.p2tr({
    internalPubkey: Buffer.from(keyPair.publicKey.slice(1, 33)),
    network,
  })
  
  if (!payment.address) {
    throw new Error('Could not generate address')
  }
  
  // Get UTXOs for the address
  const utxos = await getUTXOs(payment.address, rpcUrl)
  if (utxos.length === 0) {
    throw new Error(`No UTXOs found in ${token.networkSymbol} wallet`)
  }
  
  // Create and sign transaction
  const psbt = new bitcoin.Psbt({ network })
  let totalInput = 0n
  
  // Add inputs
  for (const utxo of utxos) {
    if (!payment.output) {
      throw new Error('Could not generate output script')
    }
    
    const internalKey = Buffer.from(keyPair.publicKey.slice(1, 33))
    
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: payment.output,
        value: BigInt(utxo.value),
      },
      tapInternalKey: internalKey,
    })
    
    totalInput += BigInt(utxo.value)
  }
  
  // Check if we have enough balance
  if (totalInput < amount) {
    throw new Error(
      `Insufficient balance. Need ${amount} satoshis, but only have ${totalInput} satoshis`
    )
  }
  
  // Get fee rate
  const feeRate = await getFeeRate(rpcUrl)
  const fee = BigInt(Math.ceil(200 * feeRate))
  const changeAmount = totalInput - amount - fee
  
  // Add recipient output
  psbt.addOutput({
    address: toAddress,
    value: amount,
  })
  
  // Add change output if needed
  if (changeAmount > 546n) {
    psbt.addOutput({
      address: payment.address,
      value: changeAmount,
    })
  }
  
  // Add OP_RETURN output with trade ID hash
  const tradeIdsHash = getTradeIdsHash([tradeId])
  psbt.addOutput({
    script: bitcoin.script.compile([
      bitcoin.opcodes.OP_RETURN, 
      Buffer.from(tradeIdsHash.slice(2), 'hex')
    ]),
    value: 0n,
  })
  
  // Sign inputs
  const toXOnly = (pubKey) => (pubKey.length === 32 ? pubKey : pubKey.slice(1, 33))
  const tweakedSigner = keyPair.tweak(bitcoin.crypto.taggedHash('TapTweak', toXOnly(keyPair.publicKey)))
  
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    psbt.signInput(i, tweakedSigner, [bitcoin.Transaction.SIGHASH_DEFAULT])
  }
  
  psbt.finalizeAllInputs()
  
  // Extract transaction
  const tx = psbt.extractTransaction()
  const rawTx = tx.toHex()
  
  // Broadcast transaction
  const response = await axios.post(`${rpcUrl}/api/tx`, rawTx, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
  
  return response.data // Transaction ID
}
```

## 5. Error Handling

The SDK includes specific error types for common scenarios:

```typescript
import { SDKError, APIError, NetworkError } from '@optimex-xyz/market-maker-sdk'

try {
  await someSDKFunction()
} catch (error) {
  if (error instanceof APIError) {
    // Handle API errors (status codes, response data)
    console.error(`API Error: ${error.status} - ${error.message}`)
  } else if (error instanceof NetworkError) {
    // Handle network connection issues
    console.error(`Network Error: ${error.message}`)
  } else if (error instanceof SDKError) {
    // Handle general SDK errors
    console.error(`SDK Error: ${error.message}`)
  } else {
    // Handle other errors
    console.error(`Unknown error: ${error.message}`)
  }
}
```

## 6. Advanced Configuration

The SDK can be configured with custom settings:

```typescript
import { sdk } from '@optimex-xyz/market-maker-sdk'

// Configure timeouts
sdk.setConfig({
  httpTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
})

// Configure custom API endpoints
sdk.setEndpoints({
  router: 'https://custom-router-api.example.com',
  solver: 'https://custom-solver-api.example.com',
})
```
