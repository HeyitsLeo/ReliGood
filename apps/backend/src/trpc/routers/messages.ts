import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { messages, customers } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'

export const messagesRouter = router({
  listByCustomer: publicProcedure
    .input(z.object({ customerId: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      const db = getDb()
      return db
        .select()
        .from(messages)
        .where(eq(messages.customerId, input.customerId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
    }),
  listRecent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => {
      const db = getDb()
      const limit = input?.limit ?? 50
      return db
        .select({
          id: messages.id,
          direction: messages.direction,
          type: messages.type,
          content: messages.content,
          intent: messages.intent,
          agent: messages.agent,
          isAi: messages.isAi,
          createdAt: messages.createdAt,
          customerId: messages.customerId,
          waName: customers.waName,
          waPhone: customers.waPhone,
        })
        .from(messages)
        .leftJoin(customers, eq(messages.customerId, customers.id))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
    }),
})
