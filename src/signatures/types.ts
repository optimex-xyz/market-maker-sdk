export const presignType = {
  Presign: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};

export const confirmDepositType = {
  ConfirmDeposit: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};

export const selectionType = {
  Selection: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};

export const rfqAuthenticationTypes = {
  Authentication: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};

export const makePaymentType = {
  MakePayment: [{ name: 'infoHash', type: 'bytes32' }],
};

export const confirmPaymentType = {
  ConfirmPayment: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};

export const confirmSettlementType = {
  ConfirmSettlement: [
    { name: 'tradeId', type: 'bytes32' },
    { name: 'infoHash', type: 'bytes32' },
  ],
};
