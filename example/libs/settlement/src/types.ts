export interface SubmitSettlementEvent {
  tradeId: string;
  paymentTxId: string;
}

export interface TransferSettlementEvent {
  tradeId: string;
}

export interface SubmitSettlementTxResponse {
  tradeId: string;
  status: string;
  error: string;
}
