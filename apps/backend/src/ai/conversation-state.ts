import { Redis } from 'ioredis'
import { env } from '../config.js'
import { REDIS_KEYS, MAX_RECENT_MESSAGES } from '@zamgo/shared'
import type { ConversationState } from './types.js'

let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
    _redis.on('error', (e) => {
      // swallow connect errors; logger not in this module
      console.error('[redis]', e.message)
    })
  }
  return _redis
}

const TTL_SECONDS = 60 * 60 * 24 // 24h

export async function loadState(customerId: string): Promise<ConversationState> {
  const key = REDIS_KEYS.CONVERSATION_STATE + customerId
  const raw = await getRedis().get(key)
  if (raw) {
    try {
      return JSON.parse(raw) as ConversationState
    } catch {
      // fall through to fresh state
    }
  }
  return freshState(customerId)
}

export async function saveState(state: ConversationState): Promise<void> {
  const key = REDIS_KEYS.CONVERSATION_STATE + state.customerId
  await getRedis().set(key, JSON.stringify(state), 'EX', TTL_SECONDS)
}

export function freshState(customerId: string): ConversationState {
  return {
    customerId,
    messageCount: 0,
    lastIntents: [],
    lastAgent: null,
    activeRequestId: null,
    activeOrderId: null,
    lastMessageAt: new Date().toISOString(),
    within24hWindow: true,
    hasPendingQuote: false,
    hasUnpaidOrder: false,
    escalatedToHuman: false,
    tags: ['new_user'],
    recentMessages: [],
  }
}

export function appendCustomerMessage(
  state: ConversationState,
  content: string,
): ConversationState {
  const recent = [
    ...state.recentMessages,
    { role: 'customer' as const, content, at: new Date().toISOString() },
  ].slice(-MAX_RECENT_MESSAGES)
  return {
    ...state,
    messageCount: state.messageCount + 1,
    lastMessageAt: new Date().toISOString(),
    within24hWindow: true,
    recentMessages: recent,
  }
}

export function appendAgentMessage(
  state: ConversationState,
  content: string,
): ConversationState {
  const recent = [
    ...state.recentMessages,
    { role: 'agent' as const, content, at: new Date().toISOString() },
  ].slice(-MAX_RECENT_MESSAGES)
  return { ...state, recentMessages: recent }
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit()
    _redis = null
  }
}
