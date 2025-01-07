import { ethers, ZeroAddress } from 'ethers'
import { DecodedError } from 'ethers-decode-error'

import { errorDecoder } from '@bitfi-mock-pmm/shared'
import { config, ensureHexPrefix, ERC20__factory, Payment__factory, routerService } from '@bitfixyz/market-maker-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ITransferStrategy, TransferParams } from '../interfaces/transfer-strategy.interface'

@Injectable()
export class EVMTransferStrategy implements ITransferStrategy {
  private pmmPrivateKey: string
  private readonly logger = new Logger(EVMTransferStrategy.name)

  private routerService = routerService
  private readonly rpcMap = new Map<string, string>([['ethereum-sepolia', 'https://eth-sepolia.public.blastapi.io']])

  constructor(private configService: ConfigService) {
    this.pmmPrivateKey = this.configService.getOrThrow<string>('PMM_EVM_PRIVATE_KEY')
  }

  async transfer(params: TransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params
    const { tokenAddress, networkId } = token

    const signer = this.getSigner(networkId)

    const paymentAddress = this.getPaymentAddress(networkId)

    if (tokenAddress !== 'native') {
      const tokenContract = ERC20__factory.connect(tokenAddress, signer)

      const allowance = await tokenContract.allowance(signer.address, paymentAddress)

      if (amount > allowance) {
        const approveTx = await tokenContract.approve(paymentAddress, amount)

        await approveTx.wait()
      }
    }

    const paymentContract = Payment__factory.connect(paymentAddress, signer)

    const protocolFee = await this.routerService.getProtocolFee(tradeId)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60)

    const decoder = errorDecoder()

    try {
      const tx = await paymentContract.payment(
        tradeId,
        tokenAddress === 'native' ? ZeroAddress : tokenAddress,
        toAddress,
        amount,
        protocolFee.amount,
        deadline,
        {
          value: tokenAddress === 'native' ? amount : 0n,
        }
      )

      this.logger.log(`Transfer transaction sent: ${tx.hash}`)

      return ensureHexPrefix(tx.hash)
    } catch (error) {
      const decodedError: DecodedError = await decoder.decode(error)

      this.logger.error(`Processing transfer tradeId ${tradeId} Execution reverted!\nReason: ${decodedError.reason}`)

      throw error
    }
  }

  private getSigner(networkId: string) {
    const rpcUrl = this.rpcMap.get(networkId)

    if (!rpcUrl) {
      throw new Error(`Unsupported networkId: ${networkId}`)
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    return new ethers.Wallet(this.pmmPrivateKey, provider)
  }

  private getPaymentAddress(networkId: string) {
    const paymentAddress = config.getPaymentAddress(networkId)
    if (!paymentAddress) {
      throw new Error(`Unsupported networkId: ${networkId}`)
    }

    return paymentAddress
  }
}
