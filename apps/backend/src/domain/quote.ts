import type { QuoteInput, QuoteBreakdown } from '@zamgo/shared'
import { loadConfig, loadCategoryWeight } from './config.js'

/**
 * Core pricing formula (MVP.md §7.5).
 *
 * Final price = (item_cost + shipping + fixed_fee) × (1 + margin)
 *   item_cost    = CNY price × (fx_cny_zmw.rate × buffer)
 *   shipping     = weight_kg × ship_per_kg_usd × (fx_usd_zmw.rate × buffer)
 *   deposit      = clamp(final × deposit_ratio, [min, max])
 */
export async function computeQuote(input: QuoteInput): Promise<QuoteBreakdown> {
  const cfg = await loadConfig([
    'fx_cny_zmw',
    'fx_usd_zmw',
    'ship_per_kg_usd',
    'fixed_fee_zmw',
    'profit_margin',
    'deposit_ratio',
  ])

  const fxCnyZmw = cfg.fx_cny_zmw.rate * cfg.fx_cny_zmw.buffer
  const fxUsdZmw = cfg.fx_usd_zmw.rate * cfg.fx_usd_zmw.buffer
  const shipUsd = cfg.ship_per_kg_usd.base
  const fixedFee = cfg.fixed_fee_zmw.amount
  const margin = cfg.profit_margin.rate

  // Resolve weight with fallback to category defaults
  let weight = input.est_weight_kg ?? 0
  if (!weight || weight <= 0) {
    const def = await loadCategoryWeight(input.category || 'default')
    weight = Number(def.defaultKg)
  }

  const itemZmw = input.taobao_price_cny * fxCnyZmw
  const shipZmw = weight * shipUsd * fxUsdZmw
  const subtotal = itemZmw + shipZmw + fixedFee
  const finalPrice = subtotal * (1 + margin)

  const depRatio = cfg.deposit_ratio.ratio
  const depMin = cfg.deposit_ratio.min_zmw
  const depMax = cfg.deposit_ratio.max_zmw
  const deposit = Math.max(depMin, Math.min(depMax, finalPrice * depRatio))

  return {
    item_cost_zmw: round2(itemZmw),
    shipping_zmw: round2(shipZmw),
    fixed_fee_zmw: fixedFee,
    subtotal_zmw: round2(subtotal),
    margin_pct: margin,
    final_price_zmw: round2(finalPrice),
    deposit_zmw: round2(deposit),
    balance_zmw: round2(finalPrice - deposit),
    fx_cny_zmw: round4(fxCnyZmw),
    fx_usd_zmw: round4(fxUsdZmw),
    weight_kg: weight,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
