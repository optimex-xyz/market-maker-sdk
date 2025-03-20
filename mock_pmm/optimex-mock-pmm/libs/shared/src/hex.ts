import * as ethers from 'ethers'

export const ensureHexPrefix = (value: string) => {
  return value.startsWith('0x') ? value : `0x${value}`
}

export const removeHexPrefix = (value: string) => {
  return value.startsWith('0x') ? value.slice(2) : value
}

export function stringToHex(str: string): string {
  const utf8Bytes = ethers.toUtf8Bytes(str)
  const paddedArray = new Uint8Array(32)
  paddedArray.set(utf8Bytes)
  return ethers.hexlify(paddedArray)
}
