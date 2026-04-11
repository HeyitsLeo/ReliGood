/**
 * Free-form conversational AI reply grounded in ReliGood business context.
 * Uses the customer's recent message history from ConversationState so the
 * model can keep context across turns.
 */
import { chat, type ChatMessage } from '../integrations/openai/index.js'
import { logger } from '../logger.js'
import type { ConversationState } from './types.js'
import { RELIGOOD_SYSTEM_PROMPT } from './prompts.js'

const FALLBACK_REPLY =
  'Let me check with our team and get back to you shortly. In the meantime, what product are you looking for? 🙏'

const ERROR_REPLY =
  'Sorry, I had trouble with that. Let me get a teammate to help you. 🙋'

/**
 * Generate a conversational reply from the LLM.
 * The `state.recentMessages` array already contains the customer's latest
 * message (appended by processInbound), so we just map it directly into
 * chat-style history without adding the user message twice.
 */
export async function chatAnswer(state: ConversationState): Promise<string> {
  const history: ChatMessage[] = state.recentMessages.map((m) => ({
    role: m.role === 'customer' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }))

  const messages: ChatMessage[] = [
    { role: 'system', content: RELIGOOD_SYSTEM_PROMPT },
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
