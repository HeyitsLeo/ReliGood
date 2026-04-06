import { getDb } from '@zamgo/db'
import { quotes } from '@zamgo/db/schema'
import type { QuoteBreakdown } from '@zamgo/shared'
import { eq } from 'drizzle-orm'

export async function saveQuote(params: {
  requestId: string
  source: string
  sourceUrl?: string | null
  titleCn?: string | null
  titleEn?: string | null
  imageUrl?: string | null
  taobaoPriceCny: number
  breakdown: QuoteBreakdown
}) {
  const db = getDb()
  const rows = await db
    .insert(quotes)
    .values({
      requestId: params.requestId,
      source: params.source,
      sourceUrl: params.sourceUrl ?? null,
      titleCn: params.titleCn ?? null,
      titleEn: params.titleEn ?? null,
      imageUrl: params.imageUrl ?? null,
      taobaoPriceCny: String(params.taobaoPriceCny),
      estWeightKg: String(params.breakdown.weight_kg),
      fxCnyZmw: String(params.breakdown.fx_cny_zmw),
      fxUsdZmw: String(params.breakdown.fx_usd_zmw),
      finalPriceZmw: String(params.breakdown.final_price_zmw),
      depositZmw: String(params.breakdown.deposit_zmw),
      profitMargin: String(params.breakdown.margin_pct),
    })
    .returning()
  return rows[0]!
}

export async function listQuotesForRequest(requestId: string) {
  const db = getDb()
  return db.select().from(quotes).where(eq(quotes.requestId, requestId))
}
