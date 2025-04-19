import { BN } from '@coral-xyz/anchor'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { routerService } from '@optimex-xyz/market-maker-sdk'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AccountMeta, Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'

import bs58 from 'bs58'

import { optimexSolProgram } from '../../artifacts'
import { ITransferStrategy, TransferParams } from '../../interfaces'
import {
  bigintToBytes32,
  createAssociatedTokenAccountInstructionIfNeeded,
  getPaymentReceiptPda,
  getProtocolPda,
  getWhitelistPda,
  sendTransactionWithRetry,
  WSOL_MINT,
} from '../../utils'
import { TelegramHelper } from '../../utils/telegram.helper'

@Injectable()
export class SolanaTransferStrategy implements ITransferStrategy {
  private pmmKeypair: Keypair
  private connection: Connection

  private readonly logger = new Logger(SolanaTransferStrategy.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramHelper: TelegramHelper
  ) {
    const endpoint = configService.getOrThrow('SOLANA_RPC_URL')
    this.connection = new Connection(endpoint, 'confirmed')

    const privateKeyString = configService.getOrThrow('PMM_SOLANA_PRIVATE_KEY')
    const privateKeyBytes = bs58.decode(privateKeyString)
    this.pmmKeypair = Keypair.fromSecretKey(privateKeyBytes)
  }

  private async checkBalance(token: PublicKey | null, amount: bigint): Promise<boolean> {
    try {
      let balance: bigint
      if (token === null) {
        // Check SOL balance
        balance = BigInt(await this.connection.getBalance(this.pmmKeypair.publicKey))
        this.logger.log(`Checking SOL balance - Address: ${this.pmmKeypair.publicKey.toBase58()}`)
      } else {
        // Check SPL token balance
        const ata = await getAssociatedTokenAddress(token, this.pmmKeypair.publicKey, true)
        const tokenBalance = await this.connection.getTokenAccountBalance(ata)
        balance = BigInt(tokenBalance.value.amount)
        this.logger.log(
          `Checking SPL token balance - Token: ${token.toBase58()}, ATA: ${ata.toBase58()}, Decimals: ${tokenBalance.value.decimals}`
        )
      }

      if (balance < amount) {
        const message = `⚠️ Insufficient Balance Alert\n\nToken: ${token ? token.toBase58() : 'SOL'}\nRequired: ${amount.toString()}\nAvailable: ${balance.toString()}\nAddress: ${this.pmmKeypair.publicKey.toBase58()}`
        await this.telegramHelper.sendMessage(message)
        return false
      }
      return true
    } catch (error) {
      this.logger.error(error, `Error checking balance for token ${token ? token.toBase58() : 'SOL'}:`)
      return false
    }
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, tradeId, token } = params
    const deadline = Math.floor(Date.now() / 1000) + 3600
    this.logger.log(`Transfer SOL tradeId ${tradeId}`, { toAddress, amount, token })
    this.logger.log(`Pmm pubkey tradeId ${tradeId}: ${this.pmmKeypair.publicKey.toBase58()}`)
    const fromUser = new PublicKey(this.pmmKeypair.publicKey)
    const toUser = new PublicKey(toAddress)
    const toToken = token.tokenAddress === 'native' ? null : new PublicKey(token.tokenAddress)
    this.logger.log(`Sender wallet address: ${fromUser.toBase58()}`)
    this.logger.log(
      `To token tradeId ${tradeId}: ${toToken?.toBase58() || 'native'}, fromuser: ${fromUser.toBase58()} toUser: ${toUser.toBase58()}`
    )

    // Check balance before proceeding
    const hasSufficientBalance = await this.checkBalance(toToken, amount)
    if (!hasSufficientBalance) {
      throw new Error('Insufficient balance for transfer')
    }

    const feeDetails = await routerService.getFeeDetails(tradeId)
    this.logger.log(`TradeId ${tradeId} ${optimexSolProgram.programId}`)
    const protocolPda = getProtocolPda()
    this.logger.log(`Protocol PDA tradeId ${tradeId}: ${protocolPda.toBase58()}`)

    const remainingAccounts: AccountMeta[] = []
    let whitelistToken: PublicKey
    if (toToken) {
      whitelistToken = getWhitelistPda(toToken)
      const fromUserAta = await getAssociatedTokenAddress(toToken, fromUser, true)
      const toUserAta = await getAssociatedTokenAddress(toToken, toUser, true)
      const protocolAta = await getAssociatedTokenAddress(toToken, protocolPda, true)
      remainingAccounts.push(
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: toToken,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: fromUserAta,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: toUserAta,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: protocolAta,
          isSigner: false,
          isWritable: true,
        }
      )
    } else {
      whitelistToken = getWhitelistPda(WSOL_MINT)
    }

    const paymentReceiptPda = getPaymentReceiptPda({
      tradeId,
      fromUser,
      toUser,
      amount,
      protocolFee: feeDetails.totalAmount,
      token: toToken,
    })

    this.logger.log(`Payment SOL tradeId ${tradeId}`, { whitelistToken, paymentReceiptPda, protocolPda, toToken })
    const paymentIns = await optimexSolProgram.methods
      .payment({
        tradeId: bigintToBytes32(BigInt(tradeId)),
        token: toToken,
        amount: new BN(amount.toString()),
        totalFee: new BN(feeDetails.totalAmount.toString()),
        deadline: new BN(deadline),
      })
      .accounts({
        signer: fromUser,
        toUser: toUser,
        whitelistToken,
        paymentReceipt: paymentReceiptPda,
      })
      .remainingAccounts(remainingAccounts)
      .instruction()

    const createDestinationAtaIns = await createAssociatedTokenAccountInstructionIfNeeded(
      this.connection,
      fromUser,
      toToken,
      toUser
    )

    this.logger.log(`Payment prepare ${tradeId}`, {
      fromUser,
      toUser,
      toToken,
      amount,
      feeAmount: feeDetails.totalAmount,
    })

    const transaction = new Transaction().add(...createDestinationAtaIns, paymentIns)
    try {
      const txHash = await sendTransactionWithRetry(this.connection, transaction, [this.pmmKeypair])
      this.logger.log('Payment successful! ', tradeId)
      this.logger.log('Transaction signature:', txHash)

      return txHash
    } catch (error) {
      this.logger.error('Payment failed', tradeId)
      this.logger.error(error)
      throw error
    }
  }
}
