import bs58check from 'bs58check'
import { ethers } from 'ethers'

import { Token } from '@bitfixyz/market-maker-sdk'

export const encodeAddress = (address: string, token: Token) => {
  switch (token.networkType.toUpperCase()) {
    case 'EVM':
      return ethers.hexlify(address)
    case 'BTC':
    case 'TBTC':
      return ethers.toUtf8Bytes(address)
    default:
      throw new Error(`Unsupported network: ${token.networkType}`)
  }
}

export const encodeUTXO = (address: string, token: Token) => {
  switch (token.networkType.toUpperCase()) {
    case 'EVM':
      return ethers.hexlify(address)
    case 'BTC':
    case 'TBTC':
      return ethers.hexlify(bs58check.decode(address))
    default:
      throw new Error(`Unsupported network: ${token.networkType}`)
  }
}

export const decodeAddress = (value: string, token: Token) => {
  switch (token.networkType.toUpperCase()) {
    case 'EVM':
      return ethers.getAddress(value)
    case 'BTC':
    case 'TBTC':
      return ethers.toUtf8String(value)
    default:
      throw new Error(`Unsupported network: ${token.networkType}`)
  }
}
