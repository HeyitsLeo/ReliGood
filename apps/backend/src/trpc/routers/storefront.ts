import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { shopifyProductsCache } from '@zamgo/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'

export const storefrontRouter = router({
  products: publicProcedure.query(async () => {
    const db = getDb()
    return db
      .select()
      .from(shopifyProductsCache)
      .where(eq(shopifyProductsCache.inStock, true))
      .orderBy(desc(shopifyProductsCache.syncedAt))
  }),

  productById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb()
      const rows = await db
        .select()
        .from(shopifyProductsCache)
        .where(eq(shopifyProductsCache.id, input.id))
        .limit(1)
      return rows[0] ?? null
    }),

  productsByCategory: publicProcedure
    .input(z.object({
      category: z.string(),
      excludeId: z.string().optional(),
      limit: z.number().default(6),
    }))
    .query(async ({ input }) => {
      const db = getDb()
      const rows = await db
        .select()
        .from(shopifyProductsCache)
        .where(and(
          eq(shopifyProductsCache.inStock, true),
          like(shopifyProductsCache.category, `${input.category.split('_')[0]}%`),
        ))
        .orderBy(desc(shopifyProductsCache.syncedAt))
        .limit(input.limit + 1)
      return rows.filter((r) => r.id !== input.excludeId).slice(0, input.limit)
    }),

  featured: publicProcedure.query(async () => {
    const db = getDb()
    return db
      .select()
      .from(shopifyProductsCache)
      .where(eq(shopifyProductsCache.inStock, true))
      .orderBy(desc(shopifyProductsCache.syncedAt))
      .limit(6)
  }),
})
