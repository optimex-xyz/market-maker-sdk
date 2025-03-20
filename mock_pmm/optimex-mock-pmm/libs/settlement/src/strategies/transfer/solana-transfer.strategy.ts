import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Router, Router__factory } from '@optimex-xyz/market-maker-sdk'
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js'

import bs58 from 'bs58'
import { ethers } from 'ethers'
import { createPaymentAndRefundAtaAndProtocolAtaIfNeededInstructions } from 'petafi-solana-js'

import { ITransferStrategy, TransferParams } from '../../interfaces'

@Injectable()
export class SolanaTransferStrategy implements ITransferStrategy {
  private pmmKeypair: Keypair
  private connection: Connection
  private contract: Router

  private readonly logger = new Logger(SolanaTransferStrategy.name)

  constructor(configService: ConfigService) {
    const endpoint = configService.getOrThrow('SOLANA_RPC_URL')
    this.connection = new Connection(endpoint, 'confirmed')

    const privateKeyString = configService.getOrThrow('PMM_SOLANA_PRIVATE_KEY')
    const privateKeyBytes = bs58.decode(privateKeyString)
    this.pmmKeypair = Keypair.fromSecretKey(privateKeyBytes)

    const rpcUrl = configService.getOrThrow<string>('RPC_URL')
    const contractAddress = configService.getOrThrow<string>('ROUTER_ADDRESS')

    const provider = new ethers.JsonRpcProvider(rpcUrl)

    this.contract = Router__factory.connect(contractAddress, provider)
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, tradeId, token } = params
    const deadline = Math.floor(Date.now() / 1000) + 3600
    const userPubkey = new PublicKey(toAddress)

    const feeDetails = await this.contract.getFeeDetails(tradeId)

    const toToken = token.tokenAddress === 'native' ? null : new PublicKey(token.tokenAddress)

    const paymentInstructions = await createPaymentAndRefundAtaAndProtocolAtaIfNeededInstructions({
      fromUser: this.pmmKeypair.publicKey,
      toUser: userPubkey,
      tradeId,
      token: toToken,
      amount: ethers.formatUnits(amount, token.tokenDecimals),
      totalFee: ethers.formatUnits(feeDetails.totalAmount, token.tokenDecimals),
      deadline,
      connection: this.connection,
    })

    const transaction = new Transaction().add(...paymentInstructions)
    const txHash = await sendAndConfirmTransaction(this.connection, transaction, [this.pmmKeypair], {
      commitment: 'confirmed',
    })
    this.logger.log('Payment successful!')
    this.logger.log('Transaction signature:', txHash)

    return txHash
  }
}
