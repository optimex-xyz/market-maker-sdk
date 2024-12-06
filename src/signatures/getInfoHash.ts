import { AbiCoder, AddressLike, BytesLike, keccak256 } from 'ethers';

const abiCoder = AbiCoder.defaultAbiCoder();

export function getPresignHash(
  pmmRecvAddress: AddressLike,
  amountIn: bigint
): string {
  const infoHash: string = keccak256(
    abiCoder.encode(['address', 'uint256'], [pmmRecvAddress, amountIn])
  );

  return infoHash;
}

export function getDepositConfirmationHash(
  amountIn: bigint,
  fromChain: [BytesLike, BytesLike, BytesLike],
  depositTxId: BytesLike,
  depositFromList: BytesLike[]
): string {
  const depositHash: string = keccak256(
    abiCoder.encode(
      ['uint256', 'bytes[3]', 'bytes[]'],
      [amountIn, fromChain, depositFromList]
    )
  );
  const infoHash: string = keccak256(
    abiCoder.encode(['bytes32', 'bytes'], [depositHash, depositTxId])
  );

  return infoHash;
}

export function getSelectPMMHash(
  pmmId: BytesLike,
  pmmRecvAddress: BytesLike,
  toChain: BytesLike,
  toToken: BytesLike,
  amountOut: bigint,
  expiry: bigint
): string {
  const infoHash: string = keccak256(
    abiCoder.encode(
      ['bytes32', 'bytes', 'bytes', 'bytes', 'uint256', 'uint256'],
      [pmmId, pmmRecvAddress, toChain, toToken, amountOut, expiry]
    )
  );

  return infoHash;
}

export function getRFQHash(minAmountOut: bigint, tradeTimeout: bigint): string {
  const infoHash: string = keccak256(
    abiCoder.encode(['uint256', 'uint256'], [minAmountOut, tradeTimeout])
  );

  return infoHash;
}

export function getTradeIdsHash(tradeIds: BytesLike[]) {
  return keccak256(abiCoder.encode(['bytes32[]'], [tradeIds]));
}

export function getMakePaymentHash(
  tradeIds: BytesLike[],
  startIdx: bigint,
  paymentTxId: BytesLike
): string {
  const bundlerHash: string = keccak256(
    abiCoder.encode(['bytes32[]'], [tradeIds])
  );
  const infoHash: string = keccak256(
    abiCoder.encode(
      ['uint256', 'bytes32', 'bytes'],
      [startIdx, bundlerHash, paymentTxId]
    )
  );

  return infoHash;
}

export function getBTCEVMConfirmPaymentHash(
  protocolFee: bigint,
  paymentAmount: bigint,
  toChain: [BytesLike, BytesLike, BytesLike],
  paymentTxId: BytesLike
): string {
  const paymentHash: string = keccak256(
    abiCoder.encode(
      ['uint256', 'uint256', 'bytes[3]'],
      [protocolFee, paymentAmount, toChain]
    )
  );
  const infoHash: string = keccak256(
    abiCoder.encode(['bytes32', 'bytes'], [paymentHash, paymentTxId])
  );

  return infoHash;
}

export function getEVMBTCConfirmPaymentHash(
  paymentAmount: bigint,
  toChain: [BytesLike, BytesLike, BytesLike],
  paymentTxId: BytesLike
): string {
  const paymentHash: string = keccak256(
    abiCoder.encode(['uint256', 'bytes[3]'], [paymentAmount, toChain])
  );
  const infoHash: string = keccak256(
    abiCoder.encode(['bytes32', 'bytes'], [paymentHash, paymentTxId])
  );

  return infoHash;
}

export function getBTCEVMConfirmSettlementHash(releaseTxId: BytesLike): string {
  const infoHash: string = keccak256(releaseTxId);

  return infoHash;
}

export function getEVMBTCConfirmSettlementHash(
  protocolFee: bigint,
  releaseTxId: BytesLike
): string {
  const infoHash: string = keccak256(
    abiCoder.encode(['uint256', 'bytes'], [protocolFee, releaseTxId])
  );

  return infoHash;
}

export function getCommitInfoHash(
  pmmId: BytesLike,
  pmmRecvAddr: BytesLike,
  toChain: BytesLike,
  toToken: BytesLike,
  amountOut: bigint,
  expiry: bigint
): string {
  const infoHash: string = keccak256(
    abiCoder.encode(
      ['bytes32', 'bytes', 'bytes', 'bytes', 'uint256', 'uint64'],
      [pmmId, pmmRecvAddr, toChain, toToken, amountOut, expiry]
    )
  );

  return infoHash;
}
