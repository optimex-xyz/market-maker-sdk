import {
  AddressLike,
  BytesLike,
  Provider,
  Signer,
  TypedDataDomain,
  verifyTypedData,
  Wallet,
} from 'ethers';

import defaultDomain from './domain';
import {
  confirmDepositType,
  confirmPaymentType,
  confirmSettlementType,
  makePaymentType,
  presignType,
  rfqAuthenticationTypes,
  selectionType,
} from './types';

export enum SignatureType {
  Presign,
  ConfirmDeposit,
  SelectPMM,
  RFQ,
  MakePayment,
  ConfirmPayment,
  ConfirmSettlement,
  VerifyingContract,
}

function getSignatureType(type: SignatureType): any {
  if (type === SignatureType.Presign) return presignType;
  else if (type === SignatureType.ConfirmDeposit) return confirmDepositType;
  else if (type === SignatureType.SelectPMM) return selectionType;
  else if (type === SignatureType.VerifyingContract) return selectionType;
  else if (type === SignatureType.RFQ) return rfqAuthenticationTypes;
  else if (type === SignatureType.MakePayment) return makePaymentType;
  else if (type === SignatureType.ConfirmPayment) return confirmPaymentType;
  else if (type === SignatureType.ConfirmSettlement)
    return confirmSettlementType;
  else throw new Error('Invalid signature type!');
}

export async function getSigner(
  provider: Provider,
  signerHelper: AddressLike,
  tradeId: BytesLike,
  infoHash: BytesLike,
  type: SignatureType,
  signature: string
) {
  const values = { tradeId: tradeId, infoHash: infoHash };
  const contractDomain: TypedDataDomain = await defaultDomain(
    signerHelper,
    provider
  );
  return verifyTypedData(
    contractDomain,
    getSignatureType(type),
    values,
    signature
  );
}

export default async function getSignature(
  Signer: Signer | Wallet,
  provider: Provider,
  signerHelper: AddressLike,
  tradeId: BytesLike,
  infoHash: BytesLike,
  type: SignatureType,
  domain?: TypedDataDomain
): Promise<string> {
  const contractDomain: TypedDataDomain = await defaultDomain(
    signerHelper,
    provider
  );

  let values: any;
  if (type === SignatureType.MakePayment) values = { infoHash };
  else values = { tradeId: tradeId, infoHash: infoHash };

  return await Signer.signTypedData(
    domain ?? contractDomain,
    getSignatureType(type),
    values
  );
}
