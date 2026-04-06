import {
  INTENT_PATTERNS_LIST,
  INTENT_TO_AGENT,
  ESCALATION_KEYWORDS,
  COMPLAINT_ESCALATION_KEYWORDS,
  type Intent,
} from '@zamgo/shared'
import type { ConversationState, RouteResult } from './types.js'
import { chat } from '../integrations/openai/index.js'
import { INTENT_CLASSIFIER_PROMPT } from './prompts.js'
import { logger } from '../logger.js'

/** Rule-based classifier — fast path, 0 cost. */
export function classifyIntentRule(
  text: string,
): { intent: Exclude<Intent, 'unknown'>; confidence: number } | null {
  for (const [intent, pattern] of INTENT_PATTERNS_LIST) {
    if (pattern.test(text)) return { intent, confidence: 0.9 }
  }
  return null
}

/** LLM fallback classifier. */
export async function classifyIntentLLM(
  text: string,
  state: ConversationState,
): Promise<{ intent: Intent; confidence: number }> {
  const history = state.recentMessages
    .slice(-5)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')
  const resp = await chat(
    [
      { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
      { role: 'user', content: `History:\n${history}\n\nLast: ${text}` },
    ],
    { json: true },
  )
  try {
    const parsed = JSON.parse(resp.content) as { intent: string; confidence: number }
    const intent = (parsed.intent ?? 'unknown') as Intent
    return { intent, confidence: parsed.confidence ?? 0.5 }
  } catch {
    return { intent: 'unknown', confidence: 0 }
  }
}

/** Decide whether to escalate to a human, based on state + text. */
export function shouldEscalate(
  text: string,
  state: ConversationState,
  intent: Intent,
  confidence: number,
): { escalate: boolean; reason?: string } {
  if (state.escalatedToHuman) return { escalate: true, reason: 'already_escalated' }
  if (ESCALATION_KEYWORDS.test(text)) return { escalate: true, reason: 'explicit_request' }
  if (intent === 'complaint' && COMPLAINT_ESCALATION_KEYWORDS.test(text)) {
    return { escalate: true, reason: 'complaint_keyword' }
  }
  if (confidence < 0.5) return { escalate: true, reason: 'low_confidence' }
  // 3 consecutive AI replies with no resolution heuristic
  const lastAi = state.lastIntents.slice(-3)
  if (lastAi.length === 3 && /\b(still|again|no|not working|don't understand)\b/i.test(text)) {
    return { escalate: true, reason: 'repeated_dissatisfaction' }
  }
  return { escalate: false }
}

/** Main entrypoint: route a customer message to an agent. */
export async function routeMessage(
  text: string,
  state: ConversationState,
): Promise<RouteResult> {
  // 1. rule first
  const rule = classifyIntentRule(text)
  if (rule && rule.confidence > 0.85) {
    const { escalate, reason } = shouldEscalate(text, state, rule.intent, rule.confidence)
    logger.debug({ intent: rule.intent, method: 'rule' }, 'router rule match')
    return {
      intent: rule.intent,
      confidence: rule.confidence,
      method: 'rule',
      agent: INTENT_TO_AGENT[rule.intent],
      escalate,
      escalateReason: reason,
    }
  }
  // 2. LLM fallback
  const llm = await classifyIntentLLM(text, state)
  const { escalate, reason } = shouldEscalate(text, state, llm.intent, llm.confidence)
  logger.debug({ intent: llm.intent, method: 'llm', conf: llm.confidence }, 'router llm match')
  return {
    intent: llm.intent,
    confidence: llm.confidence,
    method: 'llm',
    agent: INTENT_TO_AGENT[llm.intent],
    escalate,
    escalateReason: reason,
  }
}
