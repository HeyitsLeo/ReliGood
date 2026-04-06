import { getSql } from '@zamgo/db'
import { SIMILARITY_THRESHOLDS } from '@zamgo/shared'
import type { MatchCandidate } from '@zamgo/shared'
import { embed, vision } from '../integrations/openai/index.js'
import { logger } from '../logger.js'

export interface MatchResult {
  candidates: MatchCandidate[]
  bestMatch: MatchCandidate | null
  tier: 'auto_use' | 'needs_confirmation' | 'needs_taobao_search'
  keywords: string
}

/**
 * Match a customer query (text + optional image) against shopify_products_cache
 * via pgvector cosine similarity on the deterministic embeddings.
 */
export async function matchProduct(params: {
  text: string
  imageUrl?: string | null
  topK?: number
}): Promise<MatchResult> {
  const { text, imageUrl, topK = 5 } = params

  // 1. Vision keywords (if image)
  let visionKeywords = ''
  if (imageUrl) {
    const v = await vision(imageUrl)
    visionKeywords = v.keywords
  }
  const combined = [text, visionKeywords].filter(Boolean).join(' ').trim()
  logger.debug({ combined }, 'matcher: embedding query')

  // 2. Embedding
  const vec = await embed(combined)
  const literal = '[' + vec.join(',') + ']'

  // 3. pgvector query
  const sql = getSql()
  const rows = await sql<
    Array<{
      shopify_product_id: string
      title: string
      category: string | null
      price_zmw: string
      image_url: string | null
      similarity: number
      in_stock: boolean
    }>
  >`
    SELECT
      shopify_product_id,
      title,
      category,
      price_zmw,
      COALESCE(image_urls[1], NULL) AS image_url,
      (1 - (embedding <=> ${literal}::vector)) AS similarity,
      in_stock
    FROM shopify_products_cache
    WHERE in_stock = TRUE AND embedding IS NOT NULL
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${topK}
  `

  const candidates: MatchCandidate[] = rows.map((r) => ({
    shopify_product_id: r.shopify_product_id,
    title: r.title,
    category: r.category,
    price_zmw: Number(r.price_zmw),
    image_url: r.image_url,
    similarity: Number(r.similarity),
    in_stock: r.in_stock,
  }))

  const bestMatch = candidates[0] ?? null
  let tier: MatchResult['tier'] = 'needs_taobao_search'
  if (bestMatch) {
    if (bestMatch.similarity >= SIMILARITY_THRESHOLDS.AUTO_USE) tier = 'auto_use'
    else if (bestMatch.similarity >= SIMILARITY_THRESHOLDS.NEEDS_CONFIRMATION)
      tier = 'needs_confirmation'
  }

  logger.info(
    {
      best: bestMatch ? { title: bestMatch.title, sim: bestMatch.similarity.toFixed(3) } : null,
      tier,
      candidates: candidates.length,
    },
    'matcher result',
  )

  return { candidates, bestMatch, tier, keywords: combined }
}
