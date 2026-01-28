import { type Address, type PublicClient } from 'viem'

export interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: number | bigint
  verifyingContract?: Address
  salt?: `0x${string}`
}

export default async function defaultDomain(signerHelper: Address, provider: PublicClient): Promise<TypedDataDomain> {
  const chain = await provider.getChainId()
  const domainContract: TypedDataDomain = {
    name: 'BitFi',
    version: 'Version 1',
    chainId: chain,
    verifyingContract: signerHelper,
  }
  return domainContract
}
