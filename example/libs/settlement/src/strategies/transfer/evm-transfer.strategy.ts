import { errorDecoder, getProvider } from '@bitfi-mock-pmm/shared'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { config, ERC20__factory, Payment__factory, routerService } from '@optimex-xyz/market-maker-sdk'

import { ethers, TransactionRequest, ZeroAddress } from 'ethers'
import { DecodedError } from 'ethers-decode-error'

import { ITransferStrategy, TransferParams } from '../../interfaces'

@Injectable()
export class EVMTransferStrategy implements ITransferStrategy {
  private pmmPrivateKey: string
  private readonly logger = new Logger(EVMTransferStrategy.name)

  private routerService = routerService

  constructor(private configService: ConfigService) {
    this.pmmPrivateKey = this.configService.getOrThrow<string>('PMM_EVM_PRIVATE_KEY')
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params
    const { tokenAddress, networkId } = token

    const assetProvider = getProvider(token.networkId)
    const wallet = new ethers.Wallet(this.pmmPrivateKey, assetProvider)

    const paymentAddress = this.getPaymentAddress(networkId)

    if (tokenAddress !== 'native') {
      const erc20Contract = ERC20__factory.connect(tokenAddress, assetProvider)

      const currentAllowance = await erc20Contract.allowance(wallet.address, paymentAddress)

      const requiredAmount = ethers.parseUnits(amount.toString(), token.tokenDecimals)

      if (currentAllowance < requiredAmount) {
        if (currentAllowance !== 0n) {
          const erc20Interface = ERC20__factory.createInterface()
          const approveData = erc20Interface.encodeFunctionData('approve', [paymentAddress, 0n])

          const tx: TransactionRequest = {
            to: token.tokenAddress,
            data: approveData,
            value: 0n,
          }

          await wallet.sendTransaction(tx)
        }

        const erc20Interface = ERC20__factory.createInterface()
        const approveData = erc20Interface.encodeFunctionData('approve', [paymentAddress, ethers.MaxUint256])

        const tx: TransactionRequest = {
          to: token.tokenAddress,
          data: approveData,
          value: 0n,
        }

        await wallet.sendTransaction(tx)
      }

      const updatedAllowance = await erc20Contract.allowance(wallet.address, paymentAddress)

      if (updatedAllowance < requiredAmount) {
        throw new Error(
          `Insufficient token spending allowance. Please increase your approve limit. ` +
            `Current allowance: ${ethers.formatUnits(updatedAllowance, token.tokenDecimals)} ${token.tokenSymbol}\n` +
            `Required allowance: ${amount} ${token.tokenSymbol}`
        )
      }
    }

    const paymentContract = Payment__factory.connect(paymentAddress, wallet)

    const feeDetails = await this.routerService.getFeeDetails(tradeId)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60)

    const decoder = errorDecoder()

    try {
      const tx = await paymentContract.payment(
        tradeId,
        tokenAddress === 'native' ? ZeroAddress : tokenAddress,
        toAddress,
        amount,
        feeDetails.totalAmount,
        deadline,
        {
          value: tokenAddress === 'native' ? amount : 0n,
        }
      )

      this.logger.log(`Transfer transaction sent: ${tx.hash}`)

      return tx.hash
    } catch (error) {
      const decodedError: DecodedError = await decoder.decode(error)

      this.logger.error(`Processing transfer tradeId ${tradeId} Execution reverted!\nReason: ${decodedError.reason}`)

      throw error
    }
  }

  private getPaymentAddress(networkId: string) {
    const paymentAddress = config.getPaymentAddress(networkId)
    if (!paymentAddress) {
      throw new Error(`Unsupported networkId: ${networkId}`)
    }

    return paymentAddress
  }
}
