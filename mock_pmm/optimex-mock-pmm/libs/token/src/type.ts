import { z } from 'zod'

export const TokenPriceSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  currentPrice: z.number(),
  marketCap: z.number(),
})

export type TokenPrice = z.infer<typeof TokenPriceSchema>

export const ResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    traceId: z.string(),
  })

export type IResponse<T> = z.infer<ReturnType<typeof ResponseSchema<z.ZodType<T>>>>

export interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
  image: string
  currentPrice: number
  marketCap: number
  marketCapRank: number
  fullyDilutedValuation: number | null
  totalVolume: number
  high24h: number
  low24h: number
  priceChange24h: number
  priceChangePercentage24h: number
  marketCapChange24h: number
  marketCapChangePercentage24h: number
  circulatingSupply: number
  totalSupply: number | null
  maxSupply: number | null
  ath: number
  athChangePercentage: number
  athDate: string
  atl: number
  atlChangePercentage: number
  atlDate: string
  roi: {
    times: number
    currency: string
    percentage: number
  } | null
  lastUpdated: string
}
