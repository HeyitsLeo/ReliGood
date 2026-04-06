import { z } from 'zod'

// ================ Config table value schemas ================

export const FxRateSchema = z.object({
  rate: z.number().positive(),
  buffer: z.number().positive(),
  updated: z.string().optional(),
})
export type FxRate = z.infer<typeof FxRateSchema>

export const ShipPerKgSchema = z.object({ base: z.number().positive() })
export type ShipPerKg = z.infer<typeof ShipPerKgSchema>

export const FixedFeeSchema = z.object({ amount: z.number().nonnegative() })
export type FixedFee = z.infer<typeof FixedFeeSchema>

export const ProfitMarginSchema = z.object({
  rate: z.number().min(0).max(1),
  min: z.number().min(0).max(1),
  max: z.number().min(0).max(1),
})
export type ProfitMargin = z.infer<typeof ProfitMarginSchema>

export const DepositRatioSchema = z.object({
  ratio: z.number().min(0).max(1),
  min_zmw: z.number().nonnegative(),
  max_zmw: z.number().positive(),
})
export type DepositRatio = z.infer<typeof DepositRatioSchema>

export const QuoteTtlSchema = z.object({ hours: z.number().positive() })
export type QuoteTtl = z.infer<typeof QuoteTtlSchema>

export const PickupFreeDaysSchema = z.object({ days: z.number().nonnegative() })
export type PickupFreeDays = z.infer<typeof PickupFreeDaysSchema>

export const StorageFeeSchema = z.object({ amount: z.number().nonnegative() })
export type StorageFee = z.infer<typeof StorageFeeSchema>

export const CONFIG_SCHEMAS = {
  fx_cny_zmw: FxRateSchema,
  fx_usd_zmw: FxRateSchema,
  ship_per_kg_usd: ShipPerKgSchema,
  fixed_fee_zmw: FixedFeeSchema,
  profit_margin: ProfitMarginSchema,
  deposit_ratio: DepositRatioSchema,
  quote_ttl_hours: QuoteTtlSchema,
  pickup_free_days: PickupFreeDaysSchema,
  storage_fee_per_day_zmw: StorageFeeSchema,
} as const

export interface ConfigBag {
  fx_cny_zmw: FxRate
  fx_usd_zmw: FxRate
  ship_per_kg_usd: ShipPerKg
  fixed_fee_zmw: FixedFee
  profit_margin: ProfitMargin
  deposit_ratio: DepositRatio
  quote_ttl_hours: QuoteTtl
  pickup_free_days: PickupFreeDays
  storage_fee_per_day_zmw: StorageFee
}
