import { getDb } from '@zamgo/db'
import { orders } from '@zamgo/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { OrderStatus } from '@zamgo/shared'
import { ORDER_TRANSITIONS } from '@zamgo/shared'

function generateOrderCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${num}`
}

export async function insertOrder(params: {
  customerId: string
  requestId: string
  quoteId?: string | null
  totalZmw: number
  depositZmw: number
  balanceZmw: number
}) {
  const db = getDb()
  const orderCode = generateOrderCode()
  const rows = await db
    .insert(orders)
    .values({
      orderCode,
      customerId: params.customerId,
      requestId: params.requestId,
      quoteId: params.quoteId ?? null,
      totalZmw: String(params.totalZmw),
      depositZmw: String(params.depositZmw),
      balanceZmw: String(params.balanceZmw),
      status: 'draft',
    })
    .returning()
  return rows[0]!
}

export async function getOrderById(id: string) {
  const db = getDb()
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getOrderByCode(orderCode: string) {
  const db = getDb()
  const rows = await db.select().from(orders).where(eq(orders.orderCode, orderCode)).limit(1)
  return rows[0] ?? null
}

export async function transitionOrder(id: string, next: OrderStatus) {
  const db = getDb()
  const current = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)
  if (!current[0]) throw new Error(`order ${id} not found`)
  const allowed = ORDER_TRANSITIONS[current[0].status as OrderStatus] ?? []
  if (!allowed.includes(next)) {
    throw new Error(`invalid order transition: ${current[0].status} → ${next}`)
  }
  const patch: Record<string, unknown> = { status: next, updatedAt: new Date() }
  if (next === 'paid_deposit') patch.depositPaidAt = new Date()
  if (next === 'picked_up') patch.pickupAt = new Date()
  await db.update(orders).set(patch).where(eq(orders.id, id))
}

export async function updateOrderPayment(
  id: string,
  patch: { depositAirtelRef?: string | null },
) {
  const db = getDb()
  await db
    .update(orders)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(orders.id, id))
}

export async function listOrders(status?: OrderStatus) {
  const db = getDb()
  if (status) {
    return db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt))
      .limit(100)
  }
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100)
}
