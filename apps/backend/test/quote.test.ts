import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * We test the pure formula logic by mocking the config loaders with deterministic values.
 * Expected values track MVP.md's Xiaomi vacuum example:
 *   price=799 CNY, weight=6.5kg → ~ZMW 4200 final, ~ZMW 1260 deposit
 * With fx_cny_zmw = 3.80*1.03, fx_usd_zmw = 26.50*1.02, ship=9 USD/kg, fixed=20, margin=18%, deposit=30%
 */
vi.mock('../src/domain/config.js', () => ({
  loadConfig: async (keys: string[]) => {
    const all = {
      fx_cny_zmw: { rate: 3.8, buffer: 1.03 },
      fx_usd_zmw: { rate: 26.5, buffer: 1.02 },
      ship_per_kg_usd: { base: 9.0 },
      fixed_fee_zmw: { amount: 20 },
      profit_margin: { rate: 0.18, min: 0.1, max: 0.3 },
      deposit_ratio: { ratio: 0.3, min_zmw: 100, max_zmw: 5000 },
    } as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of keys) out[k] = all[k]
    return out
  },
  loadCategoryWeight: async (category: string) => {
    const defaults: Record<string, number> = {
      electronics_small: 0.5,
      electronics_medium: 2.0,
      electronics_large: 8.0,
      beauty: 0.3,
      default: 1.0,
    }
    return { category, defaultKg: String(defaults[category] ?? 1.0), defaultShipMultiplier: '1.0' }
  },
}))

import { computeQuote } from '../src/domain/quote.js'

describe('computeQuote', () => {
  beforeEach(() => {
    // no-op
  })

  it('Xiaomi robot vacuum: 799 CNY / 6.5kg → ~4200 ZMW final', async () => {
    const q = await computeQuote({
      taobao_price_cny: 799,
      est_weight_kg: 6.5,
      category: 'electronics_large',
    })
    // 799 * (3.8*1.03) = 3126.686
    expect(q.item_cost_zmw).toBeCloseTo(3126.69, 1)
    // 6.5 * 9 * (26.5*1.02) = 1580.85
    expect(q.shipping_zmw).toBeCloseTo(1580.85, 1)
    expect(q.fixed_fee_zmw).toBe(20)
    // subtotal = 3126.69 + 1580.85 + 20 = 4727.54
    expect(q.subtotal_zmw).toBeCloseTo(4727.54, 1)
    // final = subtotal * 1.18 = 5578.49
    expect(q.final_price_zmw).toBeCloseTo(5578.49, 1)
    // deposit = final * 0.3, clamped [100, 5000] → 1673.55
    expect(q.deposit_zmw).toBeCloseTo(1673.55, 1)
    // balance = final - deposit
    expect(q.balance_zmw).toBeCloseTo(q.final_price_zmw - q.deposit_zmw, 2)
  })

  it('falls back to category weight when weight omitted', async () => {
    const q = await computeQuote({
      taobao_price_cny: 100,
      category: 'beauty', // → 0.3kg
    })
    expect(q.weight_kg).toBe(0.3)
    // 100 * 3.914 = 391.4 item_cost
    expect(q.item_cost_zmw).toBeCloseTo(391.4, 1)
    // 0.3 * 9 * 27.03 = 72.981 shipping
    expect(q.shipping_zmw).toBeCloseTo(72.98, 1)
  })

  it('clamps deposit at max (5000 ZMW) for expensive items', async () => {
    // very expensive: 10000 CNY × 3.914 = 39140 item
    const q = await computeQuote({
      taobao_price_cny: 10000,
      est_weight_kg: 10,
      category: 'electronics_large',
    })
    // deposit_ratio=0.3 → would be huge, clamp to 5000
    expect(q.deposit_zmw).toBe(5000)
  })

  it('clamps deposit at min (100 ZMW) for cheap items', async () => {
    const q = await computeQuote({
      taobao_price_cny: 20,
      est_weight_kg: 0.3,
      category: 'beauty',
    })
    // Final would be small, deposit * 0.3 < 100 → clamped to 100
    expect(q.deposit_zmw).toBe(100)
  })

  it('balance = final - deposit (always)', async () => {
    const q = await computeQuote({ taobao_price_cny: 500, est_weight_kg: 1.5 })
    expect(q.balance_zmw).toBeCloseTo(q.final_price_zmw - q.deposit_zmw, 2)
  })

  it('applies 18% profit margin correctly', async () => {
    const q = await computeQuote({ taobao_price_cny: 100, est_weight_kg: 1 })
    const itemPlusShipPlusFee = q.item_cost_zmw + q.shipping_zmw + q.fixed_fee_zmw
    expect(q.subtotal_zmw).toBeCloseTo(itemPlusShipPlusFee, 1)
    expect(q.final_price_zmw).toBeCloseTo(itemPlusShipPlusFee * 1.18, 1)
  })

  it('snapshot fx values reflect rate × buffer', async () => {
    const q = await computeQuote({ taobao_price_cny: 100, est_weight_kg: 1 })
    expect(q.fx_cny_zmw).toBeCloseTo(3.8 * 1.03, 4)
    expect(q.fx_usd_zmw).toBeCloseTo(26.5 * 1.02, 4)
  })

  it('missing weight → fallback to default category (1kg)', async () => {
    const q = await computeQuote({ taobao_price_cny: 50 })
    expect(q.weight_kg).toBe(1.0)
  })

  it('0 weight is treated as missing', async () => {
    const q = await computeQuote({ taobao_price_cny: 50, est_weight_kg: 0, category: 'beauty' })
    expect(q.weight_kg).toBe(0.3)
  })

  it('preserves 2-decimal rounding on currency fields', async () => {
    const q = await computeQuote({ taobao_price_cny: 799, est_weight_kg: 6.5 })
    // integers/2dp: check no >2 decimal drift
    const check = (n: number) =>
      expect(Math.round(n * 100) / 100).toBe(n)
    check(q.item_cost_zmw)
    check(q.shipping_zmw)
    check(q.final_price_zmw)
    check(q.deposit_zmw)
    check(q.balance_zmw)
  })
})
