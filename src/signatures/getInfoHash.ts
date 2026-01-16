import { encodeAbiParameters, keccak256, parseAbiParameters, type Hex } from 'viem'

export function getTradeIdsHash(tradeIds: Hex[]): Hex {
  return keccak256(encodeAbiParameters(parseAbiParameters('bytes32[]'), [tradeIds]))
}

export function getMakePaymentHash(tradeIds: Hex[], signedAt: bigint, startIdx: bigint, paymentTxId: Hex): Hex {
  const bundlerHash: Hex = keccak256(encodeAbiParameters(parseAbiParameters('bytes32[]'), [tradeIds]))
  const infoHash: Hex = keccak256(
    encodeAbiParameters(parseAbiParameters('uint64, uint256, bytes32, bytes'), [
      signedAt,
      startIdx,
      bundlerHash,
      paymentTxId,
    ])
  )

  return infoHash
}

export function getCommitInfoHash(
  pmmId: Hex,
  pmmRecvAddr: Hex,
  toChain: Hex,
  toToken: Hex,
  amountOut: bigint,
  expiry: bigint
): Hex {
  const infoHash: Hex = keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, bytes, bytes, bytes, uint256, uint64'), [
      pmmId,
      pmmRecvAddr,
      toChain,
      toToken,
      amountOut,
      expiry,
    ])
  )

  return infoHash
}
