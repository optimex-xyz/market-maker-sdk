import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSettlementSignatureSchema = z.object({
  tradeId: z.string(),
  committedQuote: z.string(),
  solverFee: z.string(),
  tradeDeadline: z.string(),
  scriptDeadline: z.string(),
});

export class GetSettlementSignatureDto extends createZodDto(
  GetSettlementSignatureSchema
) {}

export const SettlementSignatureResponseSchema = z.object({
  tradeId: z.string(),
  signature: z.string(),
  deadline: z.number(),
  error: z.string().optional(),
});

export class SettlementSignatureResponseDto extends createZodDto(
  SettlementSignatureResponseSchema
) {}

export const AckSettlementSchema = z.object({
  tradeId: z.string(),
  tradeDeadline: z.string(),
  scriptDeadline: z.string(),
  chosen: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "chosen must be 'true' or 'false'",
  }),
});

export class AckSettlementDto extends createZodDto(AckSettlementSchema) {}

export const AckSettlementResponseSchema = z.object({
  tradeId: z.string(),
  status: z.literal('acknowledged'),
  error: z.string().optional(),
});

export class AckSettlementResponseDto extends createZodDto(
  AckSettlementResponseSchema
) {}

export const SignalPaymentSchema = z.object({
  tradeId: z.string(),
  protocolFeeAmount: z.string(),
  tradeDeadline: z.string(),
  scriptDeadline: z.string(),
});

export class SignalPaymentDto extends createZodDto(SignalPaymentSchema) {}

export const SignalPaymentResponseSchema = z.object({
  tradeId: z.string(),
  status: z.literal('acknowledged'),
  error: z.string().optional(),
});

export class SignalPaymentResponseDto extends createZodDto(
  SignalPaymentResponseSchema
) {}

export const SubmitTxSchema = z.object({
  tradeId: z.string(),
  paymentTxId: z.string(),
});

export class SubmitTxDTO extends createZodDto(SubmitTxSchema) {}
