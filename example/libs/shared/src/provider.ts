import { ethers } from 'ethers'

import { BASE_MAINNET, ETHEREUM, ETHEREUM_SEPOLIA, SEPOLIA_BASE } from './constants'

export const getRpcUrlByNetworkId = (networkId: string): string => {
  switch (networkId) {
    case ETHEREUM:
      return 'https://eth-mainnet.public.blastapi.io'
    case ETHEREUM_SEPOLIA:
      return 'https://eth-sepolia.public.blastapi.io'
    case SEPOLIA_BASE:
      return 'https://base-sepolia.public.blastapi.io'
    case BASE_MAINNET:
      return 'https://base-mainnet.public.blastapi.io'
    default:
      throw new Error(`Network ID ${networkId} not supported`)
  }
}

export const getProvider = (networkId: string) => {
  const rpcUrl = getRpcUrlByNetworkId(networkId)

  return new ethers.JsonRpcProvider(rpcUrl)
}
