/**
 * ProtocolFetcherProxy Contract Types - Auto-generated using viem
 * DO NOT EDIT MANUALLY - Run `yarn generate:abi` to regenerate
 */

import type { ContractFunctionReturnType } from 'viem'

import type { protocolFetcherProxyAbi } from '../../abi'

export type MPCInfoStructOutput = ContractFunctionReturnType<
  typeof protocolFetcherProxyAbi,
  'view',
  'getLatestMPCInfo'
>
export type TokenStructOutput = ContractFunctionReturnType<
  typeof protocolFetcherProxyAbi,
  'view',
  'getTokens'
>[number]
