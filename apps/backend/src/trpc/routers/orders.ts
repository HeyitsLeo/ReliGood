import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { orders } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ORDER_STATUSES } from '@zamgo/shared'

export const ordersRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.enum(ORDER_STATUSES).optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb()
      const status = input?.status
      if (status) {
        return db
          .select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt))
          .limit(100)
      }
      return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100)
    }),
})
