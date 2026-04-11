import { getDb } from '@zamgo/db'
import { customers } from '@zamgo/db/schema'
import { eq, sql } from 'drizzle-orm'

export interface CustomerRow {
  id: string
  waPhone: string
  waName: string | null
}

export async function upsertCustomer(waPhone: string, waName: string): Promise<CustomerRow> {
  const db = getDb()
  const now = new Date()
  // Try insert; on conflict update last_msg_at and name
  const rows = await db
    .insert(customers)
    .values({
      waPhone,
      waName: waName || null,
      lastMsgAt: now,
    })
    .onConflictDoUpdate({
      target: customers.waPhone,
      set: {
        waName: waName || null,
        lastMsgAt: now,
      },
    })
    .returning({
      id: customers.id,
      waPhone: customers.waPhone,
      waName: customers.waName,
    })

  if (rows[0]) return rows[0]

  // Fallback: fetch
  const existing = await db
    .select({ id: customers.id, waPhone: customers.waPhone, waName: customers.waName })
    .from(customers)
    .where(eq(customers.waPhone, waPhone))
    .limit(1)
  if (!existing[0]) throw new Error('upsertCustomer: insert and fetch both failed')
  return existing[0]
}

export async function getCustomerById(id: string) {
  const db = getDb()
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1)
  return rows[0] ?? null
}

/** Total number of customers. Used as the sequential member number for welcome messages. */
export async function countCustomers(): Promise<number> {
  const db = getDb()
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(customers)
  return rows[0]?.count ?? 0
}
