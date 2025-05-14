export * from './contracts'

import type { ITypes as PTypes } from './contracts/ProtocolFetcherProxy';
import type { ITypes as TTypes } from './contracts/Router';

// Auto-generated exports
export namespace ITypes {
  // Re-export all types from PTypes
  export type MPCInfoStruct = PTypes.MPCInfoStruct;
  export type MPCInfoStructOutput = PTypes.MPCInfoStructOutput;
  export type TokenInfoStruct = PTypes.TokenInfoStruct;
  export type TokenInfoStructOutput = PTypes.TokenInfoStructOutput;

  // Re-export all types from TTypes
  export type RFQInfoStruct = TTypes.RFQInfoStruct;
  export type RFQInfoStructOutput = TTypes.RFQInfoStructOutput;
  export type BundlePaymentStruct = TTypes.BundlePaymentStruct;
  export type BundlePaymentStructOutput = TTypes.BundlePaymentStructOutput;
  export type AffiliateStruct = TTypes.AffiliateStruct;
  export type AffiliateStructOutput = TTypes.AffiliateStructOutput;
  export type FailureDetailsStruct = TTypes.FailureDetailsStruct;
  export type FailureDetailsStructOutput = TTypes.FailureDetailsStructOutput;
  export type FeeDetailsStruct = TTypes.FeeDetailsStruct;
  export type FeeDetailsStructOutput = TTypes.FeeDetailsStructOutput;
  export type SelectedPMMInfoStruct = TTypes.SelectedPMMInfoStruct;
  export type SelectedPMMInfoStructOutput = TTypes.SelectedPMMInfoStructOutput;
  export type PMMSelectionStruct = TTypes.PMMSelectionStruct;
  export type PMMSelectionStructOutput = TTypes.PMMSelectionStructOutput;
  export type RefundPresignStruct = TTypes.RefundPresignStruct;
  export type RefundPresignStructOutput = TTypes.RefundPresignStructOutput;
  export type SettlementPresignStruct = TTypes.SettlementPresignStruct;
  export type SettlementPresignStructOutput = TTypes.SettlementPresignStructOutput;
  export type TradeInfoStruct = TTypes.TradeInfoStruct;
  export type TradeInfoStructOutput = TTypes.TradeInfoStructOutput;
  export type ScriptInfoStruct = TTypes.ScriptInfoStruct;
  export type ScriptInfoStructOutput = TTypes.ScriptInfoStructOutput;
  export type TradeDataStruct = TTypes.TradeDataStruct;
  export type TradeDataStructOutput = TTypes.TradeDataStructOutput;
  export type TradeFinalizationStruct = TTypes.TradeFinalizationStruct;
  export type TradeFinalizationStructOutput = TTypes.TradeFinalizationStructOutput;
}
