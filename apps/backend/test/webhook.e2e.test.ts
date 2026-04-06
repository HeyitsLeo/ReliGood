/**
 * End-to-end test: build a Fastify app, POST a signed webhook, assert DB rows.
 * Requires a running Postgres (docker compose up) with migrations + seed applied.
 * Skips entirely if DB connection fails at setup.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Stub the BullMQ queue so the test doesn't require Redis.
vi.mock('../src/queue/index.js', () => ({
  getInboundQueue: () => ({
    add: async () => ({ id: 'mock-job-id' }),
  }),
  shutdownQueue: async () => {},
  startWorker: () => ({}),
}))

import Fastify, { type FastifyInstance } from 'fastify'
import { registerWatiWebhook } from '../src/api/wati-webhook.js'
import { computeSignature } from '../src/lib/signature.js'
import { env } from '../src/config.js'
import postgres from 'postgres'

let app: FastifyInstance
let sql: ReturnType<typeof postgres> | null = null
let dbAvailable = false

beforeAll(async () => {
  try {
    sql = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 3 })
    await sql`SELECT 1`
    dbAvailable = true
  } catch {
    dbAvailable = false
    // eslint-disable-next-line no-console
    console.warn('[webhook.e2e] Skipping — DB not available')
    return
  }

  app = Fastify()
  await registerWatiWebhook(app)
  await app.ready()
})

afterAll(async () => {
  if (app) await app.close()
  if (sql) await sql.end()
})

describe('POST /api/wati/webhook', () => {
  it('rejects missing signature', async () => {
    if (!dbAvailable) return
    const body = JSON.stringify({
      eventType: 'message',
      waId: '260971111111',
      senderName: 'TestSig',
      text: 'hello',
      type: 'text',
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/wati/webhook',
      headers: { 'content-type': 'application/json' },
      payload: body,
    })
    expect(res.statusCode).toBe(401)
  })

  it('accepts signed webhook and inserts rows', async () => {
    if (!dbAvailable) return
    const phone = `+2609999${Math.floor(Math.random() * 90000) + 10000}`
    const body = JSON.stringify({
      eventType: 'message',
      waId: phone.slice(1),
      senderName: 'TestE2E',
      text: 'how much for a robot vacuum cleaner?',
      type: 'text',
      messageId: `wamid.test-${Date.now()}`,
    })
    const sig = computeSignature(body, env.WATI_WEBHOOK_SECRET)
    const res = await app.inject({
      method: 'POST',
      url: '/api/wati/webhook',
      headers: { 'content-type': 'application/json', 'x-wati-signature': sig },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ received: true })

    // Verify customer + message in DB
    const customer = await sql!`SELECT id FROM customers WHERE wa_phone = ${phone} LIMIT 1`
    expect(customer.length).toBe(1)
    const msgs = await sql!`SELECT * FROM messages WHERE customer_id = ${customer[0]!.id}`
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]!.direction).toBe('inbound')
  })

  it('rejects invalid payload (missing waId)', async () => {
    if (!dbAvailable) return
    const body = JSON.stringify({ eventType: 'message', text: 'hi' })
    const sig = computeSignature(body, env.WATI_WEBHOOK_SECRET)
    const res = await app.inject({
      method: 'POST',
      url: '/api/wati/webhook',
      headers: { 'content-type': 'application/json', 'x-wati-signature': sig },
      payload: body,
    })
    expect(res.statusCode).toBe(400)
  })
})
