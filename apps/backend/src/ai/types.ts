import type { Intent, AgentType, PendingQuoteData } from '@zamgo/shared'

/** In-flight snapshot of a conversation with a customer. Stored in Redis. */
export interface ConversationState {
  customerId: string
  messageCount: number
  lastIntents: Intent[]
  lastAgent: AgentType | null
  activeRequestId: string | null
  activeOrderId: string | null
  lastMessageAt: string // ISO
  within24hWindow: boolean
  hasPendingQuote: boolean
  hasUnpaidOrder: boolean
  awaitingPaymentVerification: boolean
  escalatedToHuman: boolean
  tags: string[]
  recentMessages: Array<{ role: 'customer' | 'agent'; content: string; at: string }>
  pendingQuoteData: PendingQuoteData | null
}

export interface RouteResult {
  intent: Intent
  confidence: number
  method: 'rule' | 'llm' | 'fallback'
  agent: AgentType
  escalate: boolean
  escalateReason?: string
}
