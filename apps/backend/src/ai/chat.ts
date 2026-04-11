/**
 * Free-form conversational AI reply grounded in ReliGood business context.
 * Uses the customer's recent message history from ConversationState so the
 * model can keep context across turns. Optionally injects top-matching
 * products from our Shopify cache so the LLM can ground its reply in real
 * inventory instead of guessing.
 */
import type { MatchCandidate } from '@zamgo/shared'
import { chat, type ChatMessage } from '../integrations/openai/index.js'
import { logger } from '../logger.js'
import type { ConversationState } from './types.js'
import { RELIGOOD_SYSTEM_PROMPT } from './prompts.js'

const FALLBACK_REPLY =
  'Let me check with our team and get back to you shortly. In the meantime, what product are you looking for? 🙏'

const ERROR_REPLY =
  'Sorry, I had trouble with that. Let me get a teammate to help you. 🙋'

/** Format top product candidates as a compact inventory snippet for the LLM. */
function formatInventorySnippet(candidates: MatchCandidate[]): string {
  if (candidates.length === 0) return ''
  const lines = candidates.map((c) => {
    const price = `K${c.price_zmw.toFixed(0)}`
    const stock = c.in_stock ? '' : ' (out of stock)'
    return `- ${c.title} — ${price}${stock}`
  })
  return [
    '',
    '',
    `CURRENT CANDIDATE PRODUCTS (top ${candidates.length} from our database, ranked by semantic similarity to the customer's last message):`,
    ...lines,
    '',
    'If any candidate clearly matches what the customer asked for, mention it by name and price. If none match, say you will check with the team and ask for more details (model, storage, color, budget, etc.). Never invent products or prices not in this list.',
  ].join('\n')
}

/**
 * Generate a conversational reply from the LLM.
 * The `state.recentMessages` array already contains the customer's latest
 * message (appended by processInbound), so we just map it directly into
 * chat-style history without adding the user message twice.
 */
export async function chatAnswer(
  state: ConversationState,
  productCandidates?: MatchCandidate[],
): Promise<string> {
  const history: ChatMessage[] = state.recentMessages.map((m) => ({
    role: m.role === 'customer' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }))

  const systemPrompt =
    RELIGOOD_SYSTEM_PROMPT + formatInventorySnippet(productCandidates ?? [])

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
  ]

  try {
    const { content } = await chat(messages)
    const reply = content.trim()
    return reply || FALLBACK_REPLY
  } catch (err) {
    logger.error(
      { err: (err as Error).message, customerId: state.customerId },
      'chatAnswer failed',
    )
    return ERROR_REPLY
  }
}
