import { Token } from '@petafixyz/market-maker-sdk';

export interface TransferParams {
  toAddress: string
  amount: bigint
  token: Token
  tradeId: string
}

export interface ITransferStrategy {
  transfer(params: TransferParams): Promise<string>
}
