import { z } from 'zod';

export const TokenSchema = z.object({
  id: z.number(),
  networkId: z.string(),
  tokenId: z.string(),
  networkName: z.string(),
  networkSymbol: z.string(),
  networkType: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  tokenLogoUri: z.string(),
  networkLogoUri: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Token = z.infer<typeof TokenSchema>
