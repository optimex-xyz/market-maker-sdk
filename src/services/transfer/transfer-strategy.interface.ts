import { Token } from '../../types';

export interface InternalTransferParams {
  toAddress: string
  amount: bigint
  token: Token
  tradeId: string
}

export interface ITransferStrategy {
  transfer(params: InternalTransferParams): Promise<string>
}
