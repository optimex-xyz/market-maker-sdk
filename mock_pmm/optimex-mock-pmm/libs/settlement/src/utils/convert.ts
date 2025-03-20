import { ensureHexPrefix } from '@bitfi-mock-pmm/shared'

import { ethers, toUtf8Bytes, toUtf8String } from 'ethers'

export const l2Encode = (info: string) => {
  if (/^0x[0-9a-fA-F]*$/.test(info)) {
    return info
  }

  return ensureHexPrefix(ethers.hexlify(toUtf8Bytes(info)))
}

export const l2Decode = (info: string) => {
  try {
    return toUtf8String(info)
  } catch {
    return info
  }
}
