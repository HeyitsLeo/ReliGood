import { getDb } from '@zamgo/db'
import { tempListings, shopifyProductsCache } from '@zamgo/db/schema'
import { eq, desc, sql, lt } from 'drizzle-orm'

export async function insertTempListing(params: {
  sourceUrl: string
  titleCn?: string | null
  titleEn?: string | null
  category?: string | null
  taobaoPriceCny: number
  estWeightKg: number
  currentPriceZmw: number
  expiresAt: Date
}) {
  const db = getDb()
  const rows = await db
    .insert(tempListings)
    .values({
      sourceUrl: params.sourceUrl,
      titleCn: params.titleCn ?? null,
      titleEn: params.titleEn ?? null,
      category: params.category ?? null,
      taobaoPriceCny: String(params.taobaoPriceCny),
      estWeightKg: String(params.estWeightKg),
      currentPriceZmw: String(params.currentPriceZmw),
      expiresAt: params.expiresAt,
    })
    .returning()
  return rows[0]!
}

export async function getTempListing(id: string) {
  const db = getDb()
  const rows = await db.select().from(tempListings).where(eq(tempListings.id, id)).limit(1)
  return rows[0] ?? null
}

export async function listActiveTempListings() {
  const db = getDb()
  return db
    .select()
    .from(tempListings)
    .where(sql`${tempListings.expiresAt} > NOW()`)
    .orderBy(desc(tempListings.createdAt))
    .limit(100)
}

/** Expire temp listings past their expiry time. Returns count of expired rows. */
export async function expireOldListings(): Promise<number> {
  const db = getDb()
  const now = new Date()

  // Mark corresponding shopify_products_cache rows as out of stock
  const expired = await db
    .select({ id: tempListings.id, shopifyProductId: tempListings.shopifyProductId })
    .from(tempListings)
    .where(lt(tempListings.expiresAt, now))

  if (expired.length === 0) return 0

  // Delete expired temp listings
  const result = await db
    .delete(tempListings)
    .where(lt(tempListings.expiresAt, now))
    .returning({ id: tempListings.id })

  // Mark any linked cache entries as out of stock
  for (const row of expired) {
    if (row.shopifyProductId) {
      await db
        .update(shopifyProductsCache)
        .set({ inStock: false })
        .where(eq(shopifyProductsCache.shopifyProductId, row.shopifyProductId))
    }
  }

  return result.length
}

export async function promoteTempListing(id: string) {
  const db = getDb()
  await db
    .update(tempListings)
    .set({ promoted: true })
    .where(eq(tempListings.id, id))
}
