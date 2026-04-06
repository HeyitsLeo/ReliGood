import { getDb } from '@zamgo/db'
import { messages } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function insertMessage(params: {
  customerId: string
  direction: 'inbound' | 'outbound'
  type: 'text' | 'image' | 'audio' | 'interactive'
  content?: string | null
  mediaUrl?: string | null
  waMessageId?: string | null
  intent?: string | null
  agent?: string | null
  isAi?: boolean
  requestId?: string | null
}) {
  const db = getDb()
  const rows = await db
    .insert(messages)
    .values({
      customerId: params.customerId,
      direction: params.direction,
      type: params.type,
      content: params.content ?? null,
      mediaUrl: params.mediaUrl ?? null,
      waMessageId: params.waMessageId ?? null,
      intent: params.intent ?? null,
      agent: params.agent ?? null,
      isAi: params.isAi ?? false,
      requestId: params.requestId ?? null,
    })
    .returning()
  return rows[0]!
}

export async function listByCustomer(customerId: string, limit = 50) {
  const db = getDb()
  return db
    .select()
    .from(messages)
    .where(eq(messages.customerId, customerId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
}

export async function listRecent(limit = 50) {
  const db = getDb()
  return db.select().from(messages).orderBy(desc(messages.createdAt)).limit(limit)
}

export async function getMessage(id: string) {
  const db = getDb()
  const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1)
  return rows[0] ?? null
}
