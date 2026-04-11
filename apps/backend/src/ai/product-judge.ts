/**
 * LLM-as-judge product matcher.
 *
 * Given the customer's recent messages and a list of candidate products from
 * the pgvector top-K, asks the LLM to decide whether any candidate is a
 * confident match. Falls back to `{matched: false}` on parse/LLM errors so
 * the caller can route to a conversational reply instead of guessing.
 */
import type { MatchCandidate } from '@zamgo/shared'
import { chat, type ChatMessage } from '../integrations/openai/index.js'
import { logger } from '../logger.js'
import type { ConversationState } from './types.js'
import { PRODUCT_JUDGE_PROMPT } from './prompts.js'

export type JudgeResult =
  | { matched: true; product: MatchCandidate; reason: string }
  | { matched: false; reason: string }

const MAX_HISTORY = 5

/** Format the candidate list as a compact table for the judge prompt. */
function formatCandidateTable(candidates: MatchCandidate[]): string {
  const header = 'id | title | category | price_zmw | in_stock'
  const rows = candidates.map((c) => {
    const id = c.shopify_product_id
    const title = c.title
    const category = c.category ?? '-'
    const price = c.price_zmw.toFixed(2)
    const stock = c.in_stock ? 'yes' : 'no'
    return `${id} | ${title} | ${category} | ${price} | ${stock}`
  })
  return [header, ...rows].join('\n')
}

export async function judgeProductMatch(
  state: ConversationState,
  candidates: MatchCandidate[],
): Promise<JudgeResult> {
  if (candidates.length === 0) {
    return { matched: false, reason: 'no_candidates' }
  }

  const history: ChatMessage[] = state.recentMessages
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'customer' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))

  const systemPrompt =
    PRODUCT_JUDGE_PROMPT +
    '\n\nCANDIDATE PRODUCTS:\n' +
    formatCandidateTable(candidates)

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
  ]

  let raw = ''
  try {
    const { content } = await chat(messages, { json: true })
    raw = content
    const parsed = JSON.parse(raw) as {
      matched_product_id?: string | null
      reason?: string
    }
    const reason = (parsed.reason ?? '').toString().slice(0, 200) || 'no_reason'
    const pickedId = parsed.matched_product_id ?? null
    if (!pickedId) {
      return { matched: false, reason }
    }
    const product = candidates.find((c) => c.shopify_product_id === pickedId)
    if (!product) {
      logger.warn(
        { pickedId, candidateIds: candidates.map((c) => c.shopify_product_id) },
        'judge picked unknown product id',
      )
      return { matched: false, reason: `unknown_id:${pickedId}` }
    }
    return { matched: true, product, reason }
  } catch (err) {
    logger.error(
      { err: (err as Error).message, raw, customerId: state.customerId },
      'judgeProductMatch failed',
    )
    return { matched: false, reason: 'judge_error' }
  }
}
