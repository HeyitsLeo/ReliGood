// ================ Enums ================

export const INTENTS = [
  'product_inquiry',
  'order_status',
  'payment_help',
  'complaint',
  'greeting',
  'faq',
  'unknown',
] as const
export type Intent = (typeof INTENTS)[number]

export const AGENT_TYPES = [
  'router',
  'inquiry',
  'matcher',
  'quote',
  'order',
  'support',
] as const
export type AgentType = (typeof AGENT_TYPES)[number]

export const PRODUCT_REQUEST_STATUSES = [
  'new',
  'matching',
  'matched_shopify',
  'needs_taobao_search',
  'taobao_found',
  'quoted',
  'accepted',
  'rejected',
  'expired',
  'closed',
] as const
export type ProductRequestStatus = (typeof PRODUCT_REQUEST_STATUSES)[number]

export const ORDER_STATUSES = [
  'draft',
  'paid_deposit',
  'ordered_from_taobao',
  'in_transit_cn',
  'arrived_cn_wh',
  'in_transit_air',
  'arrived_zm_wh',
  'ready_pickup',
  'picked_up',
  'completed',
  'refund_requested',
  'refunded',
  'cancelled',
  'no_show_forfeit',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const KANBAN_COLUMNS = ['new', 'matching', 'quoted', 'paid', 'fulfilled'] as const
export type KanbanColumn = (typeof KANBAN_COLUMNS)[number]

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number]

export const MESSAGE_TYPES = ['text', 'image', 'audio', 'interactive'] as const
export type MessageType = (typeof MESSAGE_TYPES)[number]

// ================ DTO-level types ================

export interface QuoteBreakdown {
  item_cost_zmw: number
  shipping_zmw: number
  fixed_fee_zmw: number
  subtotal_zmw: number
  margin_pct: number
  final_price_zmw: number
  deposit_zmw: number
  balance_zmw: number
  fx_cny_zmw: number
  fx_usd_zmw: number
  weight_kg: number
}

export interface MatchCandidate {
  shopify_product_id: string
  title: string
  category: string | null
  price_zmw: number
  image_url: string | null
  similarity: number
  in_stock: boolean
}

export interface RouteDecision {
  intent: Intent
  confidence: number
  method: 'rule' | 'llm' | 'fallback'
  agent: AgentType
}
