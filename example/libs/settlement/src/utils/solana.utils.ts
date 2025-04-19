import { BN } from '@coral-xyz/anchor'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Commitment, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js'

import { optimexSolProgram } from '../artifacts'

export const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

/**
 * Create a group of instructions for creating an associated token account if it not exists, return empty array if the token is null or the ata is already exists
 * @param connection - A solana connection
 * @param payer - The user who will pay for the associated token account. This user must sign the transaction
 * @param tokenPubkey - The token pubkey for the associated token account
 * @param userPubkey - The user pubkey for the associated token account
 * @returns An array of instructions for creating an associated token account if it not exists, return empty array if it already exists
 */
export async function createAssociatedTokenAccountInstructionIfNeeded(
  connection: Connection,
  payer: PublicKey,
  tokenPubkey: PublicKey | null,
  userPubkey: PublicKey,
  commitment: Commitment = 'confirmed'
) {
  if (!tokenPubkey) return []
  const userTokenAta = await getAssociatedTokenAddressSync(tokenPubkey, userPubkey, true)
  const userTokenAtaInfo = await connection.getAccountInfo(userTokenAta, commitment)
  if (!userTokenAtaInfo) {
    const createTokenAtaIns = createAssociatedTokenAccountInstruction(payer, userTokenAta, userPubkey, tokenPubkey)
    return [createTokenAtaIns]
  }
  return []
}

/**
 * Get the whitellist token PDA
 * @param token The address of the token
 * @returns The whitellist token PDA
 */
export function getWhitelistPda(token: PublicKey) {
  const [whitelistPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('whitelist'), token.toBuffer()],
    optimexSolProgram.programId
  )
  return whitelistPda
}

/**
 * Get the payment receipt PDA address
 * @dev We use lot of informations to generate the PDA address to avoid collision, and support multiple payment for each trade
 * @param paymentArgs - The parameters for getting the payment receipt PDA
 * @returns The payment receipt PDA address
 */
export function getPaymentReceiptPda(paymentArgs: {
  tradeId: string
  fromUser: PublicKey
  toUser: PublicKey
  amount: bigint
  protocolFee: bigint
  token: PublicKey | null
}) {
  const tradeIdBytes = bigintToBytes32(BigInt(paymentArgs.tradeId))
  const [paymentReceiptPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('payment_receipt'),
      Buffer.from(tradeIdBytes),
      paymentArgs.fromUser.toBuffer(),
      paymentArgs.toUser.toBuffer(),
      new BN(paymentArgs.amount.toString()).toArrayLike(Buffer, 'le', 8),
      new BN(paymentArgs.protocolFee.toString()).toArrayLike(Buffer, 'le', 8),
      paymentArgs.token ? paymentArgs.token.toBuffer() : PublicKey.default.toBuffer(),
    ],
    optimexSolProgram.programId
  )
  return paymentReceiptPda
}

/**
 * Get the protocol PDA address
 * @returns The protocol PDA address
 */
export function getProtocolPda() {
  const [protocolPda] = PublicKey.findProgramAddressSync([Buffer.from('protocol')], optimexSolProgram.programId)
  return protocolPda
}

/**
 * Convert the amount in BigInt to bytes32, pad to 32 bytes
 * @param value - The amount of ether
 * @returns The bytes32 representation of the amount
 * @example
 * Here is the example of the amount of 100,000
 * const result = parseEtherToBytes32(BigInt(100000));
 * result = [
 * 0, 0, 0, 0, 0, 0, 0, 0, 0,
 * 0, 0, 0, 0, 0, 0, 0, 0, 0,
 * 0, 0, 0, 0, 0, 0, 0, 0, 0,
 * 0, 0, 1, 134, 160 ]
 *
 * Explain: 160 * 256^0 + 134 * 256^1 + 1 * 256^2 = 100,000
 */
export function bigintToBytes32(value: bigint): number[] {
  // Convert to hex, pad to 64 chars (32 bytes) and remove 0x
  const hex = value.toString(16).padStart(64, '0')
  return Array.from(Buffer.from(hex, 'hex'))
}

export async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  commitment: Commitment = 'confirmed',
  maxRetryCount = 10
): Promise<string> {
  const blockhash = await connection.getLatestBlockhashAndContext(commitment)
  const blockHeight = await connection.getBlockHeight({
    commitment,
    minContextSlot: blockhash.context.slot,
  })

  const transactionTTL = blockHeight + 151

  let retryCount = 0
  let lastErr: any
  while (true) {
    const blockHeight = await connection.getBlockHeight(commitment)
    if (blockHeight >= transactionTTL || retryCount >= maxRetryCount) {
      throw lastErr
    }
    try {
      const txHash = await sendAndConfirmTransaction(connection, transaction, signers, {
        commitment,
      })
      return txHash
    } catch (error) {
      retryCount += 1
      lastErr = error
      await waitToRetry()
    }
  }

  async function waitToRetry(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}
