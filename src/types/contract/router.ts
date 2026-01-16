/**
 * Router Contract Types - Auto-generated using viem
 * DO NOT EDIT MANUALLY - Run `yarn generate:abi` to regenerate
 */

import type { ContractFunctionReturnType } from 'viem'

import type { routerAbi } from '../../abi'

export type AffiliateInfoStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getAffiliateInfo'
>
export type FailureInfoStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getFailureInfo'
>
export type FeeDetailsStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getFeeDetails'
>
export type PMMSelectionStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getPMMSelection'
>
export type RefundPresignStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getRefundPresign'
>
export type SettlementPresignStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getSettlementPresigns'
>[number]
export type TradeDataStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getTradeData'
>
export type TradeFinalizationStructOutput = ContractFunctionReturnType<
  typeof routerAbi,
  'view',
  'getTradeFinalization'
>

// Nested types extracted from parent structs
export type RfqInfoStructOutput = PMMSelectionStructOutput['rfqInfo']
export type PmmInfoStructOutput = PMMSelectionStructOutput['pmmInfo']
export type TradeInfoStructOutput = TradeDataStructOutput['tradeInfo']
export type ScriptInfoStructOutput = TradeDataStructOutput['scriptInfo']
