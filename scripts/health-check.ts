#!/usr/bin/env tsx
/**
 * Health check: ping backend /health and print a summary.
 */
const URL = process.env.HEALTH_URL ?? 'http://localhost:3001/health'

async function main() {
  try {
    const res = await fetch(URL)
    const body = (await res.json()) as Record<string, unknown>
    console.log(`status: ${res.status}`)
    console.log(JSON.stringify(body, null, 2))
    process.exit(res.ok ? 0 : 1)
  } catch (e) {
    console.error(`[health] unreachable: ${(e as Error).message}`)
    console.error(`Is the backend running? Try: pnpm dev`)
    process.exit(1)
  }
}

main()
