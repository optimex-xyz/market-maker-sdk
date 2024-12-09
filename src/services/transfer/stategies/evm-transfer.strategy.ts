import { ethers, JsonRpcProvider, ZeroAddress } from 'ethers'

import config from '../../../config/config'
import { Payment__factory, Router__factory } from '../../../contracts'
import { ensureHexPrefix } from '../../../utils'
import {
  InternalTransferParams,
  ITransferStrategy,
} from '../transfer-strategy.interface'

export class EVMTransferStrategy implements ITransferStrategy {
  private readonly privateKey: string
  private readonly provider: JsonRpcProvider
  private readonly contract: ReturnType<typeof Router__factory.connect>

  private readonly rpcMap = new Map<string, string>([
    ['ethereum', 'https://ethereum.blockpi.network/v1/rpc/public'],
    [
      'ethereum-sepolia',
      'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    ],
    ['base-sepolia', 'https://base-sepolia.blockpi.network/v1/rpc/public'],
  ])

  private readonly paymentAddressMap = new Map<string, string>([
    ['ethereum', '0x5d933b2cb3a0DE221F079B450d73e6B9e35272f0'],
    ['ethereum-sepolia', '0x1F0984852E1aFE19Cf31309c988ed0423A7408A4'],
    ['base-sepolia', '0x05E12AbdC28BB9AC75Fd1f21B424bebB28b39693'],
  ])

  constructor() {
    this.privateKey = config.getEvmPrivateKey()

    this.provider = new JsonRpcProvider(config.getRpcUrl())
    this.contract = Router__factory.connect(
      config.getRouterAddress(),
      this.provider
    )
  }

  async transfer(params: InternalTransferParams): Promise<string> {
    const { toAddress, amount, token, tradeId } = params
    const { tokenAddress, networkId } = token

    const signer = this.getSigner(networkId)

    const paymentContract = this.getPaymentContract(networkId, signer)

    const protocolFee = await this.contract.getProtocolFee(tradeId)

    const tx = await paymentContract.payment(
      tradeId,
      tokenAddress === 'native' ? ZeroAddress : tokenAddress,
      toAddress,
      amount,
      protocolFee.amount,
      {
        value: tokenAddress === 'native' ? amount : 0n,
      }
    )

    return ensureHexPrefix(tx.hash)
  }

  private getSigner(networkId: string) {
    const rpcUrl = this.rpcMap.get(networkId)
    if (!rpcUrl) {
      throw new Error(`Unsupported networkId: ${networkId}`)
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    return new ethers.Wallet(this.privateKey, provider)
  }

  private getPaymentContract(networkId: string, signer: ethers.Wallet) {
    const paymentAddress = this.paymentAddressMap.get(networkId)
    if (!paymentAddress) {
      throw new Error(`Unsupported networkId: ${networkId}`)
    }

    return Payment__factory.connect(paymentAddress, signer)
  }
}
