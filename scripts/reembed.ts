#!/usr/bin/env tsx
/**
 * Re-embed all shopify_products_cache rows using the real OpenAI embedding adapter.
 *
 * Usage: pnpm reembed
 * Requires: ADAPTER_MODE=real and a valid OPENAI_API_KEY in .env
 */
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: join(__dirname, '..', '.env') })

// Force real mode for embedding
process.env.ADAPTER_MODE = 'real'

const { embed } = await import('../apps/backend/src/integrations/openai/index.js')
const { db } = await import('../packages/db/src/client.js')
const { shopifyProductsCache } = await import('../packages/db/src/schema.js')
const { eq } = await import('drizzle-orm')

async function main() {
  const rows = await db.select().from(shopifyProductsCache)
  console.log(`[reembed] Found ${rows.length} products to embed`)

  let count = 0
  for (const row of rows) {
    const text = [row.title, row.description, row.category, ...(row.tags ?? [])].filter(Boolean).join(' ')
    console.log(`  [${++count}/${rows.length}] ${row.title}`)

    const embedding = await embed(text)
    await db
      .update(shopifyProductsCache)
      .set({ embedding })
      .where(eq(shopifyProductsCache.id, row.id))

    // Small delay to avoid rate limits
    if (count < rows.length) await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`[reembed] Done — ${count} products embedded`)
  process.exit(0)
}

main().catch((e) => {
  console.error('[reembed] Error:', e)
  process.exit(1)
})
