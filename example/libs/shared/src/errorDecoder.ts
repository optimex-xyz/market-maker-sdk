import { ErrorDecoder } from 'ethers-decode-error'

import { paymentErrorABI } from './errorABIs'

export const errorDecoder = (): ErrorDecoder => {
  return ErrorDecoder.create([paymentErrorABI])
}

export default errorDecoder
