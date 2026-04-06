#!/usr/bin/env tsx
/**
 * WATI Webhook Simulator
 *
 * Usage:
 *   pnpm tsx scripts/wati-simulator.ts --phone +260971234567 --name Mary --text "how much for a robot vacuum?"
 *   pnpm tsx scripts/wati-simulator.ts --image fixtures/vacuum.jpg --phone +260971234567 --text "this please"
 *   pnpm tsx scripts/wati-simulator.ts --batch              # sends all 10 sample messages
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

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3001/api/wati/webhook'
const SECRET = process.env.WATI_WEBHOOK_SECRET ?? 'dev-secret'

interface Args {
  phone?: string
  name?: string
  text?: string
  image?: string
  batch?: boolean
}

function parseArgs(): Args {
  const args: Args = {}
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a === '--batch') args.batch = true
    else if (a.startsWith('--')) {
      const k = a.slice(2) as keyof Args
      const v = argv[++i]
      ;(args as Record<string, string | boolean>)[k] = v ?? ''
    }
  }
  return args
}

interface Payload {
  eventType: string
  waId: string
  senderName: string
  text: string
  type: string
  mediaUrl?: string
  timestamp: string
  messageId: string
}

async function send(payload: Payload) {
  const body = JSON.stringify(payload)
  const sig = createHmac('sha256', SECRET).update(body).digest('hex')
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-wati-signature': sig,
    },
    body,
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
    const payload: Payload = {
      eventType: 'message',
      waId: s.phone.startsWith('+') ? s.phone.slice(1) : s.phone,
      senderName: s.name,
      text: s.text,
      type: s.type,
      timestamp: new Date().toISOString(),
      messageId: `wamid.sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }
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
    process.exit(1)
  }
  const payload: Payload = {
    eventType: 'message',
    waId: args.phone.startsWith('+') ? args.phone.slice(1) : args.phone,
    senderName: args.name ?? 'TestUser',
    text: args.text,
    type: args.image ? 'image' : 'text',
    mediaUrl: args.image ?? undefined,
    timestamp: new Date().toISOString(),
    messageId: `wamid.sim-${Date.now()}`,
  }
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
