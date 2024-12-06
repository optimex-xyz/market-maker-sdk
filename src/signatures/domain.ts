import { AddressLike, Provider, TypedDataDomain } from 'ethers';

export default async function defaultDomain(
  signerHelper: AddressLike,
  provider: Provider,
): Promise<TypedDataDomain> {
  const chainId = (await provider.getNetwork()).chainId;
  const domainContract: TypedDataDomain = {
    name: 'BitFi',
    version: 'Version 1',
    chainId: chainId,
    verifyingContract: signerHelper as string,
  };
  return domainContract;
}
