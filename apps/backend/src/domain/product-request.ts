import { getDb } from '@zamgo/db'
import { productRequests } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { ProductRequestStatus } from '@zamgo/shared'

const VALID_TRANSITIONS: Record<string, ProductRequestStatus[]> = {
  new: ['matching', 'closed'],
  matching: ['matched_shopify', 'needs_taobao_search', 'closed'],
  matched_shopify: ['quoted', 'closed'],
  needs_taobao_search: ['taobao_found', 'closed'],
  taobao_found: ['quoted', 'closed'],
  quoted: ['accepted', 'rejected', 'expired', 'closed'],
  accepted: ['closed'],
  rejected: ['closed'],
  expired: ['closed'],
  closed: [],
}

export async function createProductRequest(data: {
  customerId: string
  rawText: string
  imageUrl?: string | null
  aiKeywords?: string | null
}) {
  const db = getDb()
  const rows = await db
    .insert(productRequests)
    .values({
      customerId: data.customerId,
      rawText: data.rawText,
      imageUrl: data.imageUrl ?? null,
      aiKeywords: data.aiKeywords ?? null,
      status: 'new',
    })
    .returning()
  return rows[0]!
}

export async function updateStatus(id: string, next: ProductRequestStatus) {
  const db = getDb()
  const current = await db
    .select({ status: productRequests.status })
    .from(productRequests)
    .where(eq(productRequests.id, id))
    .limit(1)
  if (!current[0]) throw new Error(`product_request ${id} not found`)
  const allowed = VALID_TRANSITIONS[current[0].status] ?? []
  if (!allowed.includes(next)) {
    throw new Error(`invalid transition: ${current[0].status} → ${next}`)
  }
  await db
    .update(productRequests)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(productRequests.id, id))
}

export async function updateMatch(
  id: string,
  patch: { matchedSkuId?: string | null; aiKeywords?: string | null },
) {
  const db = getDb()
  await db
    .update(productRequests)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(productRequests.id, id))
}

export async function listByStatus(status: string) {
  const db = getDb()
  return db
    .select()
    .from(productRequests)
    .where(eq(productRequests.status, status))
    .orderBy(desc(productRequests.createdAt))
    .limit(100)
}

export async function listAll() {
  const db = getDb()
  return db.select().from(productRequests).orderBy(desc(productRequests.createdAt)).limit(200)
}
