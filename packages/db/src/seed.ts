import postgres from 'postgres'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mockEmbed, toVectorLiteral } from './mock-embed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = join(__dirname, '..', '..', '..', 'fixtures')

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://zamgo:zamgo_dev@localhost:5432/zamgo'

interface ShopifyFixture {
  shopify_product_id: string
  title: string
  description: string
  category: string
  price_zmw: number
  image_urls: string[]
  tags: string[]
  in_stock: boolean
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 })

  console.log('[seed] config table')
  const configRows: Array<[string, string]> = [
    ['fx_cny_zmw', JSON.stringify({ rate: 3.8, buffer: 1.03, updated: '2026-04-05' })],
    ['fx_usd_zmw', JSON.stringify({ rate: 26.5, buffer: 1.02, updated: '2026-04-05' })],
    ['ship_per_kg_usd', JSON.stringify({ base: 9.0 })],
    ['fixed_fee_zmw', JSON.stringify({ amount: 20 })],
    ['profit_margin', JSON.stringify({ rate: 0.18, min: 0.1, max: 0.3 })],
    ['deposit_ratio', JSON.stringify({ ratio: 0.3, min_zmw: 100, max_zmw: 5000 })],
    ['quote_ttl_hours', JSON.stringify({ hours: 48 })],
    ['pickup_free_days', JSON.stringify({ days: 7 })],
    ['storage_fee_per_day_zmw', JSON.stringify({ amount: 30 })],
  ]
  for (const [key, value] of configRows) {
    await sql`
      INSERT INTO config (key, value) VALUES (${key}, ${value}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
  }

  console.log('[seed] category_weight_defaults')
  const categoryRows: Array<[string, number, number]> = [
    ['electronics_small', 0.5, 1.0],
    ['electronics_medium', 2.0, 1.0],
    ['electronics_large', 8.0, 1.2],
    ['clothing', 0.4, 1.0],
    ['shoes', 0.8, 1.0],
    ['beauty', 0.3, 1.0],
    ['home_textile', 1.5, 1.0],
    ['toy', 0.6, 1.0],
    ['book', 0.5, 1.1],
    ['default', 1.0, 1.0],
  ]
  for (const [cat, kg, mult] of categoryRows) {
    await sql`
      INSERT INTO category_weight_defaults (category, default_kg, default_ship_multiplier)
      VALUES (${cat}, ${kg}, ${mult})
      ON CONFLICT (category) DO UPDATE
        SET default_kg = EXCLUDED.default_kg,
            default_ship_multiplier = EXCLUDED.default_ship_multiplier,
            updated_at = NOW()
    `
  }

  console.log('[seed] cs_agents (admin)')
  await sql`
    INSERT INTO cs_agents (name, wa_phone, role)
    VALUES ('Admin', '+260900000000', 'admin')
    ON CONFLICT DO NOTHING
  `

  console.log('[seed] shopify_products_cache (with embeddings)')
  const raw = await readFile(join(FIXTURES_DIR, 'shopify-products.json'), 'utf8')
  const products: ShopifyFixture[] = JSON.parse(raw)
  for (const p of products) {
    const textToEmbed = `${p.title} ${p.description} ${p.tags.join(' ')}`
    const vec = mockEmbed(textToEmbed)
    const literal = toVectorLiteral(vec)
    await sql`
      INSERT INTO shopify_products_cache (
        shopify_product_id, title, description, category, price_zmw,
        image_urls, tags, in_stock, embedding
      ) VALUES (
        ${p.shopify_product_id}, ${p.title}, ${p.description}, ${p.category}, ${p.price_zmw},
        ${p.image_urls}, ${p.tags}, ${p.in_stock}, ${literal}::vector
      )
      ON CONFLICT (shopify_product_id) DO UPDATE
        SET title = EXCLUDED.title,
            description = EXCLUDED.description,
            embedding = EXCLUDED.embedding,
            synced_at = NOW()
    `
  }

  console.log(`[seed] done: ${products.length} SKUs, ${categoryRows.length} categories, ${configRows.length} configs`)
  await sql.end()
}

main().catch((e) => {
  console.error('[seed] error:', e)
  process.exit(1)
})
