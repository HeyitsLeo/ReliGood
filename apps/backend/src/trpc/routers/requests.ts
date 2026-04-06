import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { productRequests, customers } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'
import { KANBAN_COLUMNS } from '@zamgo/shared'

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
})
