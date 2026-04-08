/**
 * End-to-end test: build a Fastify app, POST a signed Cloud API webhook, assert DB rows.
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
import { registerWhatsAppWebhook } from '../src/api/whatsapp-webhook.js'
import { computeSignature } from '../src/lib/signature.js'
import { env } from '../src/config.js'
import postgres from 'postgres'

let app: FastifyInstance
let sql: ReturnType<typeof postgres> | null = null
let dbAvailable = false

function makeCloudApiPayload(phone: string, name: string, text: string, messageId?: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID, display_phone_number: '15550001234' },
              contacts: [{ profile: { name }, wa_id: phone }],
              messages: [
                {
                  from: phone,
                  id: messageId ?? `wamid.test-${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

beforeAll(async () => {
  try {
    sql = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 3 })
    await sql`SELECT 1`
    dbAvailable = true
  } catch {
    dbAvailable = false
    console.warn('[webhook.e2e] Skipping — DB not available')
    return
  }

  app = Fastify()
  await registerWhatsAppWebhook(app)
  await app.ready()
})

afterAll(async () => {
  if (app) await app.close()
  if (sql) await sql.end()
})

describe('GET /api/whatsapp/webhook (verification)', () => {
  it('returns challenge when verify_token matches', async () => {
    if (!dbAvailable) return
    const res = await app.inject({
      method: 'GET',
      url: `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${env.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test_challenge_123`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('test_challenge_123')
  })

  it('rejects wrong verify_token', async () => {
    if (!dbAvailable) return
    const res = await app.inject({
      method: 'GET',
      url: '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=abc',
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('POST /api/whatsapp/webhook', () => {
  it('rejects missing signature', async () => {
    if (!dbAvailable) return
    const payload = makeCloudApiPayload('260971111111', 'TestSig', 'hello')
    const body = JSON.stringify(payload)
    const res = await app.inject({
      method: 'POST',
      url: '/api/whatsapp/webhook',
      headers: { 'content-type': 'application/json' },
      payload: body,
    })
    expect(res.statusCode).toBe(401)
  })

  it('accepts signed webhook and inserts rows', async () => {
    if (!dbAvailable) return
    const phone = `2609999${Math.floor(Math.random() * 90000) + 10000}`
    const payload = makeCloudApiPayload(phone, 'TestE2E', 'how much for a robot vacuum cleaner?')
    const body = JSON.stringify(payload)
    const sig = `sha256=${computeSignature(body, env.WHATSAPP_APP_SECRET)}`
    const res = await app.inject({
      method: 'POST',
      url: '/api/whatsapp/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ received: true })

    // Verify customer + message in DB
    const customer = await sql!`SELECT id FROM customers WHERE wa_phone = ${'+' + phone} LIMIT 1`
    expect(customer.length).toBe(1)
    const msgs = await sql!`SELECT * FROM messages WHERE customer_id = ${customer[0]!.id}`
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]!.direction).toBe('inbound')
  })

  it('rejects invalid payload (wrong object field)', async () => {
    if (!dbAvailable) return
    const body = JSON.stringify({ object: 'not_whatsapp', entry: [] })
    const sig = `sha256=${computeSignature(body, env.WHATSAPP_APP_SECRET)}`
    const res = await app.inject({
      method: 'POST',
      url: '/api/whatsapp/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    })
    expect(res.statusCode).toBe(400)
  })

  it('ignores status-only webhooks gracefully', async () => {
    if (!dbAvailable) return
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID },
                statuses: [{ id: 'wamid.xxx', status: 'read', timestamp: '1234567890' }],
              },
              field: 'messages',
            },
          ],
        },
      ],
    }
    const body = JSON.stringify(payload)
    const sig = `sha256=${computeSignature(body, env.WHATSAPP_APP_SECRET)}`
    const res = await app.inject({
      method: 'POST',
      url: '/api/whatsapp/webhook',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
  })
})
