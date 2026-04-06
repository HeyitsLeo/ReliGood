/**
 * Deterministic mock embedding: token-bag projection into a 1536-dim space,
 * with L2 normalization. Same text → same vector; texts sharing tokens get
 * similar vectors → pgvector cosine similarity becomes meaningful for the MVP.
 *
 * Used by both:
 *   - packages/db seed (to embed all shopify_products_cache rows)
 *   - apps/backend integrations/openai mock (to embed inbound queries)
 *
 * Must stay byte-identical between seed and runtime.
 */
const DIM = 1536

/** FNV-1a 32-bit hash (deterministic, no deps) */
function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Tokenize: lowercase, split on non-word, drop short/stop words */
const STOP = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'i', 'my',
  'and', 'or', 'with', 'it', 'this', 'that', 'you', 'we', 'your', 'our', 'do',
  'does', 'have', 'has', 'be', 'was', 'were', 'by', 'from', 'as', 'but', 'not',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t))
}

/**
 * Hash each token into a few dimensions and increment those with small
 * Gaussian-like values. Then L2-normalize.
 */
export function mockEmbed(text: string): number[] {
  const vec = new Array<number>(DIM).fill(0)
  const tokens = tokenize(text)
  if (tokens.length === 0) {
    // Still produce a unit vector so we don't get NaNs downstream
    vec[0] = 1
    return vec
  }

  for (const tok of tokens) {
    // Hash into 8 dimensions per token (boost signal overlap)
    for (let k = 0; k < 8; k++) {
      const h = fnv1a(`${tok}:${k}`)
      const idx = h % DIM
      // Sign bit from a different hash so identical keys don't cancel
      const signBit = fnv1a(`s:${tok}:${k}`) & 1
      const magnitude = ((h >>> 8) % 1000) / 1000 + 0.5 // 0.5 ~ 1.5
      vec[idx] += signBit === 0 ? magnitude : -magnitude
    }
  }

  // L2-normalize so cosine similarity = dot product
  let norm = 0
  for (let i = 0; i < DIM; i++) norm += vec[i]! * vec[i]!
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < DIM; i++) vec[i]! /= norm
  return vec
}

/** Format a number[] as a pgvector string literal: "[0.1,0.2,...]" */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`
}
