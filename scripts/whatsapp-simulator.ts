#!/usr/bin/env tsx
/**
 * WhatsApp Webhook Simulator
 *
 * Sends mock webhook payloads to the local backend.
 * Supports both Cloud API format (default) and Twilio format (--twilio).
 *
 * Usage:
 *   pnpm sim --phone +260971234567 --name Mary --text "how much for a robot vacuum?"
 *   pnpm sim --image fixtures/vacuum.jpg --phone +260971234567 --text "this please"
 *   pnpm sim --batch              # sends all 10 sample messages
 *   pnpm sim --twilio --phone +260971234567 --name Mary --text "hello"
 */
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Tiny .env loader — no dep required.
async function loadDotEnv(path: string) {
  try {
    const raw = await readFile(path, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // no .env, ignore
  }
}
await loadDotEnv(join(__dirname, '..', '.env'))

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3001/api/whatsapp/webhook'
const SECRET = process.env.WHATSAPP_APP_SECRET ?? 'dev-secret'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '000000000000000'

const TWILIO_WEBHOOK_URL = process.env.TWILIO_WEBHOOK_URL ?? 'http://localhost:3001/api/twilio/webhook'
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? 'test-twilio-token'

interface Args {
  phone?: string
  name?: string
  text?: string
  image?: string
  batch?: boolean
  twilio?: boolean
}

function parseArgs(): Args {
  const args: Args = {}
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a === '--batch') args.batch = true
    else if (a === '--twilio') args.twilio = true
    else if (a.startsWith('--')) {
      const k = a.slice(2) as keyof Args
      const v = argv[++i]
      ;(args as Record<string, string | boolean>)[k] = v ?? ''
    }
  }
  return args
}

function makePayload(phone: string, name: string, text: string, imageMediaId?: string) {
  const waId = phone.startsWith('+') ? phone.slice(1) : phone
  const msgId = `wamid.sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const timestamp = String(Math.floor(Date.now() / 1000))

  const message: Record<string, unknown> = {
    from: waId,
    id: msgId,
    timestamp,
    type: imageMediaId ? 'image' : 'text',
  }

  if (imageMediaId) {
    message.image = { id: imageMediaId, mime_type: 'image/jpeg', caption: text }
  } else {
    message.text = { body: text }
  }

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: PHONE_NUMBER_ID, display_phone_number: '15550001234' },
              contacts: [{ profile: { name }, wa_id: waId }],
              messages: [message],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

async function send(payload: object) {
  const body = JSON.stringify(payload)
  const sig = `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': sig,
    },
    body,
  })
  const text = await res.text()
  const status = res.status
  console.log(`  → ${status} ${text.slice(0, 100)}`)
  return { status, text }
}

function makeTwilioParams(phone: string, name: string, text: string, imageUrl?: string): Record<string, string> {
  const waId = phone.startsWith('+') ? phone.slice(1) : phone
  const sid = `SM${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  const params: Record<string, string> = {
    SmsMessageSid: sid,
    MessageSid: sid,
    AccountSid: 'ACtest000000000000000000000000',
    From: `whatsapp:+${waId}`,
    To: `whatsapp:+14155238886`,
    Body: text,
    NumMedia: imageUrl ? '1' : '0',
    ProfileName: name,
    WaId: waId,
    MessageType: 'text',
  }
  if (imageUrl) {
    params.MediaUrl0 = imageUrl
    params.MediaContentType0 = 'image/jpeg'
    params.MessageType = 'image'
  }
  return params
}

function computeTwilioSig(url: string, params: Record<string, string>): string {
  const keys = Object.keys(params).sort()
  let data = url
  for (const key of keys) data += key + params[key]
  return createHmac('sha1', TWILIO_AUTH_TOKEN).update(data, 'utf8').digest('base64')
}

async function sendTwilio(params: Record<string, string>) {
  const sig = computeTwilioSig(TWILIO_WEBHOOK_URL, params)
  const formBody = new URLSearchParams(params)
  const res = await fetch(TWILIO_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-twilio-signature': sig,
    },
    body: formBody.toString(),
  })
  const text = await res.text()
  const status = res.status
  console.log(`  → ${status} ${text.slice(0, 100)}`)
  return { status, text }
}

async function runBatch() {
  const samplesPath = join(__dirname, '..', 'fixtures', 'sample-messages.json')
  const raw = await readFile(samplesPath, 'utf8')
  const samples = JSON.parse(raw) as Array<{
    phone: string
    name: string
    text: string
    type: string
  }>
  console.log(`[sim] sending ${samples.length} sample messages to ${WEBHOOK_URL}`)
  for (const s of samples) {
    const payload = makePayload(s.phone, s.name, s.text)
    console.log(`  ${s.name}: "${s.text}"`)
    await send(payload)
    // small delay so logs interleave nicely
    await new Promise((r) => setTimeout(r, 300))
  }
  console.log('[sim] batch done')
}

async function runSingle(args: Args) {
  if (!args.phone || !args.text) {
    console.error('Usage: --phone <+260...> --text "<message>" [--name <name>] [--image <path>]')
    console.error('   or: --batch')
    console.error('   or: --twilio --phone <+260...> --text "<message>" [--name <name>]')
    process.exit(1)
  }

  if (args.twilio) {
    const params = makeTwilioParams(args.phone, args.name ?? 'TestUser', args.text, args.image)
    console.log(`[sim:twilio] → ${args.phone} ${args.name ?? ''}: "${args.text}"`)
    await sendTwilio(params)
    return
  }

  const imageMediaId = args.image ? `media-${Date.now()}` : undefined
  const payload = makePayload(args.phone, args.name ?? 'TestUser', args.text, imageMediaId)
  console.log(`[sim] → ${args.phone} ${args.name ?? ''}: "${args.text}"`)
  await send(payload)
}

async function main() {
  const args = parseArgs()
  if (args.batch) await runBatch()
  else await runSingle(args)
}

main().catch((e) => {
  console.error('[sim] error:', e)
  process.exit(1)
})
