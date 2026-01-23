# SimplePMM API Specification

API specification for SimplePMM services that integrate with the PMM Delegator. SimplePMMs provide liquidity through a simplified 2-endpoint interface.

## Table of Contents

- [SimplePMM API Specification](#simplepmm-api-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
    - [1.1. Integration Architecture](#11-integration-architecture)
    - [1.2. API Summary](#12-api-summary)
    - [1.3. Operator-Based Routing](#13-operator-based-routing)
  - [2. Endpoints](#2-endpoints)
    - [2.1. `GET /quote` - Unified Quote Endpoint](#21-get-quote---unified-quote-endpoint)
      - [Request Parameters](#request-parameters)
      - [Example Requests](#example-requests)
      - [Response](#response)
    - [2.2. `POST /trigger-transfer` - Transfer Execution](#22-post-trigger-transfer---transfer-execution)
      - [Request Body](#request-body)
      - [Response](#response-1)
      - [SimplePMM Actions](#simplepmm-actions)
  - [3. Callback to PMM Delegator](#3-callback-to-pmm-delegator)
    - [3.1. `POST /submit-transfer`](#31-post-submit-transfer)
      - [Request Body](#request-body-1)
      - [Response](#response-2)
  - [4. Signature Specification](#4-signature-specification)
    - [Message Format](#message-format)
    - [Examples](#examples)
    - [Signing Code](#signing-code)
    - [Verification Code](#verification-code)
  - [5. Error Handling](#5-error-handling)
    - [Error Codes](#error-codes)
    - [Error Response Format](#error-response-format)
    - [Retry Strategy](#retry-strategy)
  - [6. Implementation Examples](#6-implementation-examples)
  - [7. Open Discussion Items](#7-open-discussion-items)
    - [7.1. Critical Issues](#71-critical-issues)
    - [7.2. Unresolved Questions](#72-unresolved-questions)

---

## 1. Overview

### 1.1. Integration Architecture

```
┌──────────────────┐     Full PMM API      ┌──────────────────┐
│                  │ ◄──────────────────── │                  │
│   PMM Delegator  │                       │      Solver      │
│                  │ ────────────────────► │                  │
└────────┬─────────┘                       └──────────────────┘
         │
         │ SimplePMM API (2 endpoints)
         ▼
┌──────────────────┐
│    SimplePMM     │
│                  │
│  • GET /quote    │
│  • POST /trigger │
└──────────────────┘
```

### 1.2. API Summary

| Endpoint            | Method | Direction             | Purpose                                       |
| ------------------- | ------ | --------------------- | --------------------------------------------- |
| `/quote`            | GET    | Delegator → SimplePMM | Get quote (indicative/commitment/liquidation) |
| `/trigger-transfer` | POST   | Delegator → SimplePMM | Trigger token transfer to user                |
| `/submit-transfer`  | POST   | SimplePMM → Delegator | Submit completed transfer tx                  |

### 1.3. Operator-Based Routing

Solver specifies which SimplePMM handles each trade via `operator_pmm` parameter:

```
Solver: GET /indicative-quote?operator_pmm=operator_a&...
                    │
                    ▼
PMM Delegator: Lookup "operator_a" in config
                    │
                    ▼
SimplePMM Alpha: GET /quote?type=indicative&...
```

PMM Delegator only routes to the **specific SimplePMM** matching `operator_pmm`, not all registered SimplePMMs.

**Quote Type Mapping:**

| PMM Delegator receives from Solver        | SimplePMM `/quote` type |
| ----------------------------------------- | ----------------------- |
| `GET /indicative-quote?operator_pmm=xxx`  | `?type=indicative`      |
| `GET /commitment-quote?operator_pmm=xxx`  | `?type=commitment`      |
| `GET /liquidation-quote?operator_pmm=xxx` | `?type=liquidation`     |

---

## 2. Endpoints

### 2.1. `GET /quote` - Unified Quote Endpoint

Returns a quote with cryptographic signature for any quote type.

#### Request Parameters

| Parameter          | Type   | Required    | Description                                  |
| ------------------ | ------ | ----------- | -------------------------------------------- |
| `type`             | string | Yes         | `indicative`, `commitment`, or `liquidation` |
| `trade_id`         | string | Conditional | Required for commitment/liquidation          |
| `from_token_id`    | string | Yes         | Source token identifier                      |
| `to_token_id`      | string | Yes         | Destination token identifier                 |
| `amount`           | string | Yes         | Input amount (base 10, BigInt)               |
| `to_user_address`  | string | Yes         | User's receiving address                     |
| `trade_deadline`   | string | Conditional | Payment deadline (UNIX timestamp)            |
| `script_deadline`  | string | Conditional | Withdrawal deadline (UNIX timestamp)         |
| `payment_metadata` | string | Optional    | Hex-encoded metadata (liquidation only)      |

#### Example Requests

**Indicative:**

```
GET /quote?type=indicative&from_token_id=ETH&to_token_id=BTC&amount=1000000000000000000&to_user_address=bc1q...
```

**Commitment:**

```
GET /quote?type=commitment&trade_id=0x3bfe...&from_token_id=ETH&to_token_id=BTC&amount=1000000000000000000&to_user_address=bc1q...&trade_deadline=1696012800&script_deadline=1696016400
```

**Liquidation:**

```
GET /quote?type=liquidation&trade_id=0x3bfe...&from_token_id=ETH&to_token_id=BTC&amount=1000000000000000000&to_user_address=bc1q...&trade_deadline=1696012800&script_deadline=1696016400&payment_metadata=0x...
```

#### Response

```json
{
  "simple_pmm_address": "0x1234567890abcdef1234567890abcdef12345678",
  "quote": "987654321000000000",
  "signature": "0x...",
  "timestamp": 1696000000,
  "quote_timeout": 1696003600,
  "error": ""
}
```

| Field                | Type    | Description                                                 |
| -------------------- | ------- | ----------------------------------------------------------- |
| `simple_pmm_address` | string  | SimplePMM's wallet address                                  |
| `quote`              | string  | Output amount (BigInt string)                               |
| `signature`          | string  | EVM signature (see [Section 4](#4-signature-specification)) |
| `timestamp`          | integer | UNIX timestamp when signed                                  |
| `quote_timeout`      | integer | Quote expiration (0 = no timeout)                           |
| `error`              | string  | Error message (empty if success)                            |

---

### 2.2. `POST /trigger-transfer` - Transfer Execution

PMM Delegator instructs SimplePMM to execute token transfer.

#### Request Body

```json
{
  "trade_id": "0x3bfe2fc4889a98a39b31b348e7b212ea3f2bea63fd1ea2e0c8ba326433677328",
  "from_token_id": "ETH",
  "to_token_id": "BTC",
  "amount_in": "1000000000000000000",
  "amount_out": "4500000",
  "to_user_address": "bc1p68q6hew27ljf4ghvlnwqz0fq32qg7tsgc7jr5levfy8r74p5k52qqphk07",
  "trade_deadline": "1696012800",
  "total_fee_amount": "1000000000000000",
  "original_quote_signature": "0x...",
  "original_quote_timestamp": 1696000000
}
```

| Field                      | Type    | Description                        |
| -------------------------- | ------- | ---------------------------------- |
| `trade_id`                 | string  | Unique trade identifier            |
| `from_token_id`            | string  | Source token                       |
| `to_token_id`              | string  | Destination token                  |
| `amount_in`                | string  | Input amount (BigInt)              |
| `amount_out`               | string  | Output amount to transfer (BigInt) |
| `to_user_address`          | string  | User's receiving address           |
| `trade_deadline`           | string  | Payment deadline (UNIX timestamp)  |
| `total_fee_amount`         | string  | Fee amount (BigInt)                |
| `original_quote_signature` | string  | Signature from `/quote` response   |
| `original_quote_timestamp` | integer | Timestamp from `/quote` response   |

#### Response

```json
{
  "trade_id": "0x3bfe...",
  "status": "acknowledged",
  "error": ""
}
```

#### SimplePMM Actions

1. Verify `original_quote_signature` matches own signature
2. Queue transfer for execution
3. Execute on-chain transfer before `trade_deadline`
4. Call Delegator's `/submit-transfer` with tx hash

---

## 3. Callback to PMM Delegator

### 3.1. `POST /submit-transfer`

SimplePMM submits completed transfer to PMM Delegator.

#### Request Body

```json
{
  "trade_id": "0x3bfe2fc4889a98a39b31b348e7b212ea3f2bea63fd1ea2e0c8ba326433677328",
  "tx_hash": "0x7a87d2c423e13533b5ae0ecc5af900a7b697048103f4f6e32d19edde5e707355",
  "network_id": "ethereum",
  "signature": "0x...",
  "timestamp": 1696000000
}
```

| Field        | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| `trade_id`   | string  | Trade identifier                |
| `tx_hash`    | string  | On-chain transaction hash       |
| `network_id` | string  | Network where transfer executed |
| `signature`  | string  | Original quote signature        |
| `timestamp`  | integer | Original quote timestamp        |

#### Response

```json
{
  "trade_id": "0x3bfe...",
  "status": "submitted",
  "error": ""
}
```

---

## 4. Signature Specification

SimplePMM signs quotes using EVM personal sign (`eth_sign`).

### Message Format

```
{simple_pmm_address} quote {quote_amount} for {trade_id_or_session} at {timestamp}
```

### Examples

**Commitment/Liquidation (with trade_id):**

```
0x1234567890abcdef1234567890abcdef12345678 quote 987654321000000000 for 0x3bfe2fc4889a98a39b31b348e7b212ea3f2bea63fd1ea2e0c8ba326433677328 at 1696000000
```

**Indicative (with session_id):**

```
0x1234567890abcdef1234567890abcdef12345678 quote 987654321000000000 for session_abc123 at 1696000000
```

### Signing Code

```typescript
import { ethers } from 'ethers'

const message = `${simplePmmAddress} quote ${quote} for ${tradeId} at ${timestamp}`
const signature = await wallet.signMessage(message)
```

### Verification Code

```typescript
const recoveredAddress = ethers.verifyMessage(message, signature)
const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
```

---

## 5. Error Handling

### Error Codes

| HTTP | Code                    | Description                   |
| ---- | ----------------------- | ----------------------------- |
| 400  | `INVALID_SIGNATURE`     | Signature verification failed |
| 400  | `INVALID_AMOUNT`        | Amount mismatch               |
| 400  | `QUOTE_EXPIRED`         | Quote timeout exceeded        |
| 400  | `TRADE_NOT_FOUND`       | Unknown trade_id              |
| 400  | `INSUFFICIENT_BALANCE`  | Not enough funds              |
| 409  | `TRADE_ALREADY_SETTLED` | Trade completed               |
| 500  | `TRANSFER_FAILED`       | On-chain failure              |
| 503  | `SERVICE_UNAVAILABLE`   | Temporarily unavailable       |

### Error Response Format

```json
{
  "trade_id": "0x3bfe...",
  "status": "error",
  "error": "INVALID_SIGNATURE: Quote signature verification failed"
}
```

### Retry Strategy

| Error                  | Retry | Strategy            |
| ---------------------- | ----- | ------------------- |
| Network timeout        | Yes   | Exponential backoff |
| `SERVICE_UNAVAILABLE`  | Yes   | Wait 5s             |
| `INSUFFICIENT_BALANCE` | No    | —                   |
| `INVALID_SIGNATURE`    | No    | —                   |

---

## 6. Implementation Examples

<details>
<summary><strong>GET /quote Implementation</strong></summary>

```typescript
import { ethers } from 'ethers'

interface QuoteRequest {
  type: 'indicative' | 'commitment' | 'liquidation'
  trade_id?: string
  from_token_id: string
  to_token_id: string
  amount: string
  to_user_address: string
}

async function handleQuote(req: QuoteRequest) {
  const address = process.env.SIMPLE_PMM_ADDRESS!
  const privateKey = process.env.SIMPLE_PMM_PRIVATE_KEY!

  // Calculate quote (your pricing logic)
  const quote = await calculateQuote(req)

  const timestamp = Math.floor(Date.now() / 1000)
  const identifier = req.trade_id || `session_${crypto.randomUUID()}`

  // Sign quote
  const message = `${address} quote ${quote} for ${identifier} at ${timestamp}`
  const wallet = new ethers.Wallet(privateKey)
  const signature = await wallet.signMessage(message)

  // Set timeout (1hr indicative, 30min commitment/liquidation)
  const quoteTimeout = req.type === 'indicative' ? timestamp + 3600 : timestamp + 1800

  return {
    simple_pmm_address: address,
    quote: quote.toString(),
    signature,
    timestamp,
    quote_timeout: quoteTimeout,
    error: '',
  }
}
```

</details>

<details>
<summary><strong>POST /trigger-transfer Implementation</strong></summary>

```typescript
import { ethers } from 'ethers'

interface TriggerRequest {
  trade_id: string
  to_token_id: string
  amount_out: string
  to_user_address: string
  trade_deadline: string
  original_quote_signature: string
  original_quote_timestamp: number
}

async function handleTriggerTransfer(req: TriggerRequest) {
  const address = process.env.SIMPLE_PMM_ADDRESS!

  // Verify signature
  const message = `${address} quote ${req.amount_out} for ${req.trade_id} at ${req.original_quote_timestamp}`
  const recovered = ethers.verifyMessage(message, req.original_quote_signature)

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return { trade_id: req.trade_id, status: 'error', error: 'INVALID_SIGNATURE' }
  }

  // Queue transfer
  await transferQueue.add({
    tradeId: req.trade_id,
    token: req.to_token_id,
    amount: req.amount_out,
    recipient: req.to_user_address,
    deadline: parseInt(req.trade_deadline),
    signature: req.original_quote_signature,
    timestamp: req.original_quote_timestamp,
  })

  return { trade_id: req.trade_id, status: 'acknowledged', error: '' }
}

// Worker: Execute transfer and submit to Delegator
async function processTransfer(job: TransferJob) {
  const txHash = await executeTransfer(job.token, job.amount, job.recipient)

  await fetch(`${DELEGATOR_URL}/submit-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trade_id: job.tradeId,
      tx_hash: txHash,
      network_id: getNetworkId(job.token),
      signature: job.signature,
      timestamp: job.timestamp,
    }),
  })
}
```

</details>

---

## 7. Open Discussion Items

> **Status:** These items need team discussion before production deployment.

### 7.1. Critical Issues

| #   | Issue                         | Description                                                                                                                                    | Impact |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | **Callback Failure**          | SimplePMM transfers tokens but `/submit-transfer` callback fails. Trade stuck - Solver never notified. Need retry policy or Delegator polling. | HIGH   |
| 2   | **Quote Timeout Enforcement** | Who enforces `quote_timeout`? What if `/trigger-transfer` arrives after timeout? Reject or honor?                                              | MEDIUM |
| 3   | **Signature Reuse**           | Same signature used across quote → trigger-transfer → submit-transfer. Need replay protection clarification.                                   | HIGH   |

### 7.2. Unresolved Questions

1. **Operator validation:** What if `operator_pmm` not provided or not in config? Return 400 or route to default?

2. **Concurrent trades:** Can single SimplePMM handle multiple trades simultaneously? Resource locking needed?

3. **Partial execution:** Can SimplePMM execute partial amount if insufficient liquidity? Or all-or-nothing?

4. **Quote staleness:** If indicative quote is 1hr old, can commitment quote differ significantly? Slippage protection?

5. **Network-specific routing:** How does Delegator handle cross-network routing (e.g., EVM SimplePMM for BTC output)?
