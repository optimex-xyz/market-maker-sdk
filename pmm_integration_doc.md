# Updated PMM Integration API Documentation

This document provides detailed information about the endpoints that your PMM (Private Market Maker) will need to implement to interact with our solver backend. The endpoints are used to provide indicative quotes, commitment quotes, settlement signatures, and to submit settlement transactions. Each endpoint's expected request parameters and response formats are described below.

---

## Table of Contents

1. [PMM Endpoints](#pmm-endpoints)
   - [1. `/indicative-quote`](#1-endpoint-indicative-quote)
   - [2. `/commitment-quote`](#2-endpoint-commitment-quote)
   - [3. `/settlement-signature`](#3-endpoint-settlement-signature)
   - [4. `/ack-settlement`](#4-endpoint-ack-settlement)
   - [5. `/signal-payment`](#5-endpoint-signal-payment)
2. [Solver Backend Endpoints for PMMs](#solver-backend-endpoints-for-pmms)
   - [1. `/tokens`](#1-endpoint-tokens)
   - [2. `/submit-settlement-tx`](#2-endpoint-submit-settlement-tx)
3. [General Notes for PMMs](#general-notes-for-pmms)

---

## PMM Endpoints

### 1. Endpoint: `/indicative-quote`

#### Description

Provides an indicative quote for the given token pair and trade amount. The quote is used for informational purposes before a commitment is made.

#### Request Parameters

- **HTTP Method**: `GET`
- **Query Parameters**:
  - `from_token_id` (string): The ID of the source token.
  - `to_token_id` (string): The ID of the destination token.
  - `amount` (string): The amount of the source token to be traded, represented as a string in base 10 to accommodate large numbers.
  - `session_id` (string, optional): A unique identifier for the session.

#### Example Request

```
GET /indicative-quote?from_token_id=ETH&to_token_id=BTC&amount=1000000000000000000&session_id=12345
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "session_id": "12345",
    "pmm_receiving_address": "0xReceivingAddress",
    "indicative_quote": "123456789000000000",
    "error": "" // Empty if no error
  }
  ```

  - `session_id` (string): The session ID associated with the request.
  - `pmm_receiving_address` (string): The receiving address where the user will send the `from_token`.
  - `indicative_quote` (string): The indicative quote value, represented as a string.
  - `error` (string): Error message, if any (empty if no error).

#### Example code

```ts

export const IndicativeQuoteResponseSchema = z.object({
  sessionId: z.string(),
  pmmReceivingAddress: z.string(),
  indicativeQuote: z.string(),
  error: z.string().optional(),
});

export type IndicativeQuoteResponse = z.infer<
  typeof IndicativeQuoteResponseSchema
>;

async getIndicativeQuote(
  dto: GetIndicativeQuoteDto
): Promise<IndicativeQuoteResponse> {
  const sessionId = dto.sessionId || this.generateSessionId();

  try {
    const [fromToken, toToken] = await Promise.all([
      this.tokenService.getTokenByTokenId(dto.fromTokenId),
      this.tokenService.getTokenByTokenId(dto.toTokenId),
    ]).catch((error) => {
      throw new BadRequestException(
        `Failed to fetch tokens: ${error.message}`
      );
    });

    const [fromTokenPrice, toTokenPrice] = await Promise.all([
      this.tokenRepo.getTokenPrice(fromToken.tokenSymbol),
      this.tokenRepo.getTokenPrice(toToken.tokenSymbol),
    ]).catch((error) => {
      throw new BadRequestException(
        `Failed to fetch token prices: ${error.message}`
      );
    });

    const quote = this.calculateBestQuote(...);

    const pmmAddress = this.getPmmAddressByNetworkType(fromToken);

    await this.sessionRepo.save(sessionId, {
      fromToken: dto.fromTokenId,
      toToken: dto.toTokenId,
      amount: dto.amount,
      pmmReceivingAddress: pmmAddress,
      indicativeQuote: quote,
    });

    return {
      sessionId,
      pmmReceivingAddress: pmmAddress,
      indicativeQuote: quote,
      error: '',
    };
  } catch (error: any) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }
}

```
---

### 2. Endpoint: `/commitment-quote`

#### Description

Provides a commitment quote for a specific trade, representing a firm commitment to proceed under the quoted conditions.

#### Request Parameters

- **HTTP Method**: `GET`
- **Query Parameters**:
  - `session_id` (string): A unique identifier for the session.
  - `trade_id` (string): The unique identifier for the trade.
  - `from_token_id` (string): The ID of the source token.
  - `to_token_id` (string): The ID of the destination token.
  - `amount` (string): The amount of the source token to be traded, in base 10.
  - `from_user_address` (string): The address of the user initiating the trade.
  - `to_user_address` (string): The address where the user will receive the `to_token`.
  - `user_deposit_tx` (string): The transaction hash where the user deposited their funds.
  - `user_deposit_vault` (string): The vault where the user's deposit is kept.
  - `trade_deadline` (string): The UNIX timestamp (in seconds) by which the user expects to receive payment.
  - `script_deadline` (string): The UNIX timestamp (in seconds) after which the user can withdraw their deposit if not paid.

#### Example Request

```
GET /commitment-quote?session_id=12345&trade_id=abcd1234&from_token_id=ETH&to_token_id=BTC&amount=1000000000000000000&from_user_address=0xUserAddress&to_user_address=0xReceivingAddress&user_deposit_tx=0xDepositTxHash&user_deposit_vault=VaultData&trade_deadline=1696012800&script_deadline=1696016400
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "trade_id": "abcd1234",
    "commitment_quote": "987654321000000000",
    "error": "" // Empty if no error
  }
  ```

  - `trade_id` (string): The trade ID associated with the request.
  - `commitment_quote` (string): The committed quote value, represented as a string.
  - `error` (string): Error message, if any (empty if no error).

---

### 3. Endpoint: `/settlement-signature`

#### Description

Returns a signature from the PMM to confirm the settlement quote, required to finalize the trade.

#### Request Parameters

- **HTTP Method**: `GET`
- **Query Parameters**:
  - `trade_id` (string): The unique identifier for the trade.
  - `committed_quote` (string): The committed quote value in base 10.
  - `solver_fee` (string): The fee amount for the solver in base 10.
  - `trade_deadline` (string): The UNIX timestamp (in seconds) by which the user expects to receive payment.
  - `script_deadline` (string): The UNIX timestamp (in seconds) after which the user can withdraw their deposit if not paid.

#### Example Request

```
GET /settlement-signature?trade_id=abcd1234&committed_quote=987654321000000000&solver_fee=5000000000000000&trade_deadline=1696012800&script_deadline=1696016400
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "trade_id": "abcd1234",
    "signature": "0xSignatureData",
    "deadline": 1696012800,
    "error": "" // Empty if no error
  }
  ```

  - `trade_id` (string): The trade ID associated with the request.
  - `signature` (string): The signature provided by the PMM.
  - `deadline` (integer): The UNIX timestamp (in seconds) indicating the PMM's expected payment deadline.
  - `error` (string): Error message, if any (empty if no error).

---

### 4. Endpoint: `/ack-settlement`

#### Description

Used by the solver to acknowledge to the PMM about a successful settlement, indicating whether the PMM is selected.

#### Request Parameters

- **HTTP Method**: `POST`
- **Form Parameters**:
  - `trade_id` (string): The unique identifier for the trade.
  - `trade_deadline` (string): The UNIX timestamp (in seconds) by which the user expects to receive payment.
  - `script_deadline` (string): The UNIX timestamp (in seconds) after which the user can withdraw their deposit if not paid.
  - `chosen` (string): `"true"` if the PMM is selected, `"false"` otherwise.

#### Example Request

```
POST /ack-settlement
Content-Type: application/x-www-form-urlencoded

trade_id=abcd1234&trade_deadline=1696012800&script_deadline=1696016400&chosen=true
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "trade_id": "abcd1234",
    "status": "acknowledged",
    "error": "" // Empty if no error
  }
  ```

  - `trade_id` (string): The trade ID associated with the request.
  - `status` (string): Status of the acknowledgment (always `"acknowledged"`).
  - `error` (string): Error message, if any (empty if no error).

---

### 5. Endpoint: `/signal-payment`

#### Description

Used by the solver to signal the chosen PMM to start submitting their payment.

#### Request Parameters

- **HTTP Method**: `POST`
- **Form Parameters**:
  - `trade_id` (string): The unique identifier for the trade.
  - `protocol_fee_amount` (string): The amount of protocol fee the PMM has to submit, in base 10.
  - `trade_deadline` (string): The UNIX timestamp (in seconds) by which the user expects to receive payment.
  - `script_deadline` (string): The UNIX timestamp (in seconds) after which the user can withdraw their deposit if not paid.

#### Example Request

```
POST /signal-payment
Content-Type: application/x-www-form-urlencoded

trade_id=abcd1234&protocol_fee_amount=1000000000000000&trade_deadline=1696012800&script_deadline=1696016400
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "trade_id": "abcd1234",
    "status": "acknowledged",
    "error": "" // Empty if no error
  }
  ```

  - `trade_id` (string): The trade ID associated with the request.
  - `status` (string): Status of the acknowledgment (always `"acknowledged"`).
  - `error` (string): Error message, if any (empty if no error).

---

## Solver Backend Endpoints for PMMs

### 1. Endpoint: `/tokens`

#### Description

Returns a list of tokens supported by the Solver Backend.

#### Request Parameters

- **HTTP Method**: `GET`

#### Example Request

```
GET /tokens
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "tokens": [
      {
        "id": "ETH",
        "chain_id": "1",
        "address": "0xAddress",
        "name": "Ethereum",
        "decimal": 18
      },
      {
        "id": "BTC",
        "chain_id": "bitcoin",
        "address": "native",
        "name": "Bitcoin",
        "decimal": 8
      }
    ]
  }
  ```

  - `tokens` (array): A list of supported tokens with their information.

---

### 2. Endpoint: `/submit-settlement-tx`

#### Description

Allows the PMM to submit the settlement transaction hash for one or more trades. This step is necessary to complete the trade settlement process.

#### Request Parameters

- **HTTP Method**: `POST`
- **Request Body** (JSON):

  ```json
  {
    "trade_ids": ["0xTradeID1", "0xTradeID2", "..."],
    "pmm_id": "pmm001",
    "settlement_tx": "0xSettlementTransactionData",
    "signature": "0xSignatureData",
    "start_index": 0,
    "signed_at": 1719158400 // unix timestamp in seconds
  }
  ```

  - `trade_ids` (array of strings): An array of trade IDs associated with the settlement transaction.
  - `pmm_id` (string): The PMM's ID, which must match the one committed for the trade(s).
  - `settlement_tx` (string): The raw transaction data (in hex) representing the settlement.
  - `signature` (string): The PMM's signature on the settlement transaction.
  - `start_index` (integer): The index indicating the starting point for settlement processing (used for batch settlements).
  - `signed_at` (integer): The UNIX timestamp (in seconds) when the PMM signed the settlement transaction.

#### Example Request

```
POST /submit-settlement-tx
Content-Type: application/json

{
  "trade_ids": ["0xabcdef123456...", "0x123456abcdef..."],
  "pmm_id": "pmm001",
  "settlement_tx": "0xRawTransactionData",
  "signature": "0xSignatureData",
  "start_index": 0,
  "signed_at": 1719158400
}
```

#### Expected Response

- **HTTP Status**: `200 OK`
- **Response Body** (JSON):

  ```json
  {
    "message": "Settlement transaction submitted successfully"
  }
  ```

  - `message` (string): Confirmation message indicating successful submission.

#### Notes

- **Trade IDs**: Provide all trade IDs included in the settlement transaction.
- **Start Index**: Used when submitting a batch of settlements to indicate the position within the batch.
- **Signature**: Must be valid and verifiable by the solver backend.

---

## General Notes for PMMs

- **Consistency**: Ensure that the parameter names and data types match exactly as specified.
- **Error Handling**: If an error occurs, set the `error` field in the response and provide a meaningful message.
- **Time Sensitivity**: Respond promptly to avoid timeouts; the solver has strict time constraints.
- **Data Types**: All amounts and numerical values are represented as strings in base 10 to handle large numbers.
- **Security**: All signatures must be valid and verifiable by the solver backend.
- **Communication**: Keep logs of all interactions for troubleshooting purposes.
- **Batch Processing**: When submitting settlements for multiple trades, use the `trade_ids` array and `start_index` to manage batch settlements effectively.
