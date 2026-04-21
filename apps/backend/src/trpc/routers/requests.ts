import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { productRequests, customers, tempListings, shopifyProductsCache } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'
import { KANBAN_COLUMNS, PRODUCT_REQUEST_STATUSES } from '@zamgo/shared'
import { updateStatus } from '../../domain/product-request.js'

/**
 * Map Kanban columns → set of underlying statuses.
 * quoted covers both matched_shopify and taobao_found pre-quote states for Kanban display.
 */
const KANBAN_MAP: Record<(typeof KANBAN_COLUMNS)[number], string[]> = {
  new: ['new'],
  matching: ['matching', 'matched_shopify', 'needs_taobao_search', 'taobao_found'],
  quoted: ['quoted'],
  paid: ['accepted'],
  fulfilled: ['closed'],
}

export const requestsRouter = router({
  listByStatus: publicProcedure
    .input(z.object({ status: z.enum(KANBAN_COLUMNS) }))
    .query(async ({ input }) => {
      const db = getDb()
      const statuses = KANBAN_MAP[input.status]
      const rows = await db
        .select({
          id: productRequests.id,
          rawText: productRequests.rawText,
          aiKeywords: productRequests.aiKeywords,
          status: productRequests.status,
          imageUrl: productRequests.imageUrl,
          matchedSkuId: productRequests.matchedSkuId,
          createdAt: productRequests.createdAt,
          customerId: productRequests.customerId,
          waName: customers.waName,
          waPhone: customers.waPhone,
        })
        .from(productRequests)
        .leftJoin(customers, eq(productRequests.customerId, customers.id))
        .orderBy(desc(productRequests.createdAt))
        .limit(100)
      return rows.filter((r) => statuses.includes(r.status))
    }),

  listAll: publicProcedure.query(async () => {
    const db = getDb()
    return db
      .select()
      .from(productRequests)
      .orderBy(desc(productRequests.createdAt))
      .limit(200)
  }),

  // ── G4: Status transition mutation ──
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(PRODUCT_REQUEST_STATUSES),
      }),
    )
    .mutation(async ({ input }) => {
      await updateStatus(input.id, input.status)
      return { ok: true }
    }),

  // ── G4: Assign CS agent ──
  assign: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        csAgentId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb()
      await db
        .update(productRequests)
        .set({ assignedCsId: input.csAgentId, updatedAt: new Date() })
        .where(eq(productRequests.id, input.id))
      return { ok: true }
    }),

  // ── G9: Promote temp listing to permanent store product ──
  listToStore: publicProcedure
    .input(
      z.object({
        tempListingId: z.string().uuid(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb()
      const listing = await db
        .select()
        .from(tempListings)
        .where(eq(tempListings.id, input.tempListingId))
        .limit(1)
      if (!listing[0]) throw new Error('Temp listing not found')
      const tl = listing[0]

      // Mark as promoted
      await db
        .update(tempListings)
        .set({ promoted: true })
        .where(eq(tempListings.id, input.tempListingId))

      // Upsert into shopify_products_cache as permanent (isTemp = false)
      const productId = `promoted-${tl.id}`
      await db
        .insert(shopifyProductsCache)
        .values({
          shopifyProductId: productId,
          title: tl.titleEn || tl.titleCn || 'Untitled',
          description: `Sourced from ${tl.sourceUrl}`,
          category: input.category || tl.category,
          priceZmw: tl.currentPriceZmw,
          isTemp: false,
          inStock: true,
        })
        .onConflictDoUpdate({
          target: shopifyProductsCache.shopifyProductId,
          set: {
            isTemp: false,
            inStock: true,
            category: input.category || tl.category,
            syncedAt: new Date(),
          },
        })

      return { ok: true, productId }
    }),
})
