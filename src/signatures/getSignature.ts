import {
  recoverTypedDataAddress,
  type Address,
  type Hex,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
} from 'viem'

import defaultDomain, { type TypedDataDomain } from './domain'
import {
  confirmDepositType,
  confirmPaymentType,
  confirmSettlementType,
  makePaymentType,
  rfqAuthenticationTypes,
  selectionType,
} from './types'

export enum SignatureType {
  ConfirmDeposit,
  SelectPMM,
  RFQ,
  MakePayment,
  ConfirmPayment,
  ConfirmSettlement,
  VerifyingContract,
}

function getSignatureType(type: SignatureType): any {
  if (type === SignatureType.ConfirmDeposit) return confirmDepositType
  else if (type === SignatureType.SelectPMM) return selectionType
  else if (type === SignatureType.VerifyingContract) return selectionType
  else if (type === SignatureType.RFQ) return rfqAuthenticationTypes
  else if (type === SignatureType.MakePayment) return makePaymentType
  else if (type === SignatureType.ConfirmPayment) return confirmPaymentType
  else if (type === SignatureType.ConfirmSettlement) return confirmSettlementType
  else throw new Error('Invalid signature type!')
}

export async function getSigner(
  provider: PublicClient,
  signerHelper: Address,
  tradeId: Hex,
  infoHash: Hex,
  type: SignatureType,
  signature: Hex
): Promise<Address> {
  const values = { tradeId: tradeId, infoHash: infoHash }
  const contractDomain = await defaultDomain(signerHelper, provider)
  const types = getSignatureType(type)

  return await recoverTypedDataAddress({
    domain: contractDomain as any,
    types,
    primaryType: Object.keys(types)[0],
    message: values,
    signature,
  })
}

export async function getSignature(
  signer: LocalAccount | WalletClient,
  provider: PublicClient,
  signerHelper: Address,
  tradeId: Hex,
  infoHash: Hex,
  type: SignatureType,
  domain?: TypedDataDomain
): Promise<Hex> {
  const contractDomain = await defaultDomain(signerHelper, provider)
  const types = getSignatureType(type)
  const primaryType = Object.keys(types)[0]

  let values: any
  if (type === SignatureType.MakePayment) values = { infoHash }
  else values = { tradeId: tradeId, infoHash: infoHash }

  // Handle both LocalAccount and WalletClient
  if ('signTypedData' in signer && typeof signer.signTypedData === 'function') {
    // WalletClient
    const walletClient = signer as WalletClient
    return await walletClient.signTypedData({
      account: walletClient.account!,
      domain: (domain ?? contractDomain) as any,
      types,
      primaryType,
      message: values,
    })
  } else {
    // LocalAccount
    const account = signer as LocalAccount
    return await account.signTypedData({
      domain: (domain ?? contractDomain) as any,
      types,
      primaryType,
      message: values,
    })
  }
}
