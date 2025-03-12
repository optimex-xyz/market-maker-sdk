import { AbiCoder, AddressLike, BytesLike, keccak256 } from 'ethers'

const abiCoder = AbiCoder.defaultAbiCoder()

export function getTradeIdsHash(tradeIds: BytesLike[]) {
  return keccak256(abiCoder.encode(['bytes32[]'], [tradeIds]))
}

export function getMakePaymentHash(
  tradeIds: BytesLike[],
  signedAt: bigint,
  startIdx: bigint,
  paymentTxId: BytesLike
): string {
  const bundlerHash: string = keccak256(abiCoder.encode(['bytes32[]'], [tradeIds]))
  const infoHash: string = keccak256(
    abiCoder.encode(['uint64', 'uint256', 'bytes32', 'bytes'], [signedAt, startIdx, bundlerHash, paymentTxId])
  )

  return infoHash
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
  )

  return infoHash
}
