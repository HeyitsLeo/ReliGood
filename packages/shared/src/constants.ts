import type { Intent, AgentType } from './types.js'

/**
 * Rule-based intent patterns (from MVP.md §6.2).
 * Evaluated in array order — more specific patterns come first.
 */
export const INTENT_PATTERNS_LIST: Array<[Exclude<Intent, 'unknown'>, RegExp]> = [
  // Complaints first (highest priority)
  [
    'complaint',
    /\b(broken|damaged|wrong|refund|return|scam|angry|complain|report|terrible|awful)\b/i,
  ],
  // Order status
  [
    'order_status',
    /\b(where is|status|track|when|arrive|delivery|pickup|ready|shipped|on the way|eta)\b.*?\b(order|parcel|thing|stuff|item|package)\b|\bORD-\d+/i,
  ],
  // Payment
  [
    'payment_help',
    /\b(airtel|mtn|mobile money|pay|payment|deposit|transfer|how to pay|already paid|sent money)\b/i,
  ],
  // Product inquiry
  [
    'product_inquiry',
    /\b(how much|price|quote|cost|cheap|buy|order|looking for|need|want|do you have|got any|available|vacuum|rice cooker|airfryer|phone|earbuds|lotion)\b/i,
  ],
  // FAQ
  [
    'faq',
    /\b(how long|how many days|warehouse|shop location|location|opening hours|ship from|from china|delivery time|working hours)\b/i,
  ],
  // Greetings (check last since short)
  [
    'greeting',
    /^(hi|hello|hey|morning|good morning|good afternoon|muli bwanji|mwapoleni|howdy|hola)\b/i,
  ],
]

/** Map each intent to the agent that handles it */
export const INTENT_TO_AGENT: Record<Intent, AgentType> = {
  product_inquiry: 'matcher',
  order_status: 'order',
  payment_help: 'order',
  complaint: 'support',
  greeting: 'inquiry',
  faq: 'inquiry',
  unknown: 'inquiry',
}

/** Human-escalation trigger words */
export const ESCALATION_KEYWORDS =
  /\b(human|real person|manager|supervisor|sue|lawyer|police|threaten)\b/i

/** Support/complaint keywords that trigger auto-escalation */
export const COMPLAINT_ESCALATION_KEYWORDS =
  /\b(broken|scam|refund|angry|threaten to sue|fraud|cheat|stolen)\b/i

/** Similarity thresholds (MVP.md §6.3) */
export const SIMILARITY_THRESHOLDS = {
  AUTO_USE: 0.85,
  NEEDS_CONFIRMATION: 0.75,
} as const

/** Max recent messages kept in ConversationState */
export const MAX_RECENT_MESSAGES = 10

/** BullMQ queue names */
export const QUEUE_NAMES = {
  INBOUND: 'process-inbound',
} as const

/** Redis key prefixes */
export const REDIS_KEYS = {
  CONVERSATION_STATE: 'conv:state:',
  CONFIG: 'config:',
  FAQ_CACHE: 'faq:',
} as const

/** Config keys (MVP.md §4.1 table 9) */
export const CONFIG_KEYS = [
  'fx_cny_zmw',
  'fx_usd_zmw',
  'ship_per_kg_usd',
  'fixed_fee_zmw',
  'profit_margin',
  'deposit_ratio',
  'quote_ttl_hours',
  'pickup_free_days',
  'storage_fee_per_day_zmw',
] as const
export type ConfigKey = (typeof CONFIG_KEYS)[number]
