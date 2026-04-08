/**
 * End-to-end test: build a Fastify app, POST a Twilio-format webhook, assert DB rows.
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
import { registerTwilioWebhook } from '../src/api/twilio-webhook.js'
import { computeTwilioSignature } from '../src/lib/signature.js'
import { env } from '../src/config.js'
import postgres from 'postgres'

let app: FastifyInstance
let sql: ReturnType<typeof postgres> | null = null
let dbAvailable = false

const TEST_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN || 'test-twilio-token'

function makeTwilioParams(phone: string, name: string, text: string, extra?: Record<string, string>): Record<string, string> {
  const waId = phone.startsWith('+') ? phone.slice(1) : phone
  const sid = `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  return {
    SmsMessageSid: sid,
    MessageSid: sid,
    AccountSid: 'ACtest000000000000000000000000',
    From: `whatsapp:+${waId}`,
    To: `whatsapp:+14155238886`,
    Body: text,
    NumMedia: '0',
    ProfileName: name,
    WaId: waId,
    MessageType: 'text',
    ...extra,
  }
}

beforeAll(async () => {
  try {
    sql = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 3 })
    await sql`SELECT 1`
    dbAvailable = true
  } catch {
    dbAvailable = false
    console.warn('[twilio-webhook.e2e] Skipping — DB not available')
    return
  }

  app = Fastify()
  await registerTwilioWebhook(app)
  await app.ready()
})

afterAll(async () => {
  if (app) await app.close()
  if (sql) await sql.end()
})

describe('POST /api/twilio/webhook', () => {
  it('rejects missing signature when auth token is set', async () => {
    if (!dbAvailable || !env.TWILIO_AUTH_TOKEN) return
    const params = makeTwilioParams('260971111111', 'TestSig', 'hello')
    const res = await app.inject({
      method: 'POST',
      url: '/api/twilio/webhook',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams(params).toString(),
    })
    expect(res.statusCode).toBe(401)
  })

  it('accepts signed webhook and inserts rows', async () => {
    if (!dbAvailable) return
    const phone = `2609999${Math.floor(Math.random() * 90000) + 10000}`
    const params = makeTwilioParams(phone, 'TwilioTestUser', 'how much for a robot vacuum cleaner?')
    const webhookUrl = 'http://localhost:80/api/twilio/webhook'
    const sig = computeTwilioSignature(webhookUrl, params, TEST_AUTH_TOKEN)
    const res = await app.inject({
      method: 'POST',
      url: '/api/twilio/webhook',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-twilio-signature': sig,
        host: 'localhost:80',
      },
      payload: new URLSearchParams(params).toString(),
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('<Response/>')

    // Verify customer + message in DB
    const customer = await sql!`SELECT id FROM customers WHERE wa_phone = ${'+' + phone} LIMIT 1`
    expect(customer.length).toBe(1)
    const msgs = await sql!`SELECT * FROM messages WHERE customer_id = ${customer[0]!.id}`
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]!.direction).toBe('inbound')
  })

  it('handles image messages with MediaUrl', async () => {
    if (!dbAvailable) return
    const phone = `2609888${Math.floor(Math.random() * 90000) + 10000}`
    const params = makeTwilioParams(phone, 'ImageUser', 'check this out', {
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/test-image.jpg',
      MediaContentType0: 'image/jpeg',
    })
    const webhookUrl = 'http://localhost:80/api/twilio/webhook'
    const sig = computeTwilioSignature(webhookUrl, params, TEST_AUTH_TOKEN)
    const res = await app.inject({
      method: 'POST',
      url: '/api/twilio/webhook',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-twilio-signature': sig,
        host: 'localhost:80',
      },
      payload: new URLSearchParams(params).toString(),
    })
    expect(res.statusCode).toBe(200)

    const customer = await sql!`SELECT id FROM customers WHERE wa_phone = ${'+' + phone} LIMIT 1`
    expect(customer.length).toBe(1)
    const msgs = await sql!`SELECT * FROM messages WHERE customer_id = ${customer[0]!.id} ORDER BY created_at DESC LIMIT 1`
    expect(msgs[0]!.type).toBe('image')
    expect(msgs[0]!.media_url).toBe('https://api.twilio.com/media/test-image.jpg')
  })

  it('returns empty TwiML for missing WaId', async () => {
    if (!dbAvailable) return
    const params = { Body: 'test', NumMedia: '0' }
    const webhookUrl = 'http://localhost:80/api/twilio/webhook'
    const sig = computeTwilioSignature(webhookUrl, params as Record<string, string>, TEST_AUTH_TOKEN)
    const res = await app.inject({
      method: 'POST',
      url: '/api/twilio/webhook',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-twilio-signature': sig,
        host: 'localhost:80',
      },
      payload: new URLSearchParams(params).toString(),
    })
    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('<Response/>')
  })
})
