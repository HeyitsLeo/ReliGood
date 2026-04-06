import { z } from 'zod'
import { INTENTS, PRODUCT_REQUEST_STATUSES, ORDER_STATUSES, MESSAGE_TYPES } from './types.js'

// ================ WATI webhook ================

export const WatiWebhookPayloadSchema = z.object({
  eventType: z.string(),
  waId: z.string().min(5),
  senderName: z.string().optional().default(''),
  text: z.string().optional().default(''),
  type: z.enum(['text', 'image', 'audio', 'interactive']).default('text'),
  mediaUrl: z.string().optional(),
  timestamp: z.string().optional(),
  messageId: z.string().optional(),
})
export type WatiWebhookPayload = z.infer<typeof WatiWebhookPayloadSchema>

// ================ Quote ================

export const QuoteInputSchema = z.object({
  taobao_price_cny: z.number().positive(),
  est_weight_kg: z.number().nonnegative().optional(),
  category: z.string().optional(),
})
export type QuoteInput = z.infer<typeof QuoteInputSchema>

export const QuoteBreakdownSchema = z.object({
  item_cost_zmw: z.number(),
  shipping_zmw: z.number(),
  fixed_fee_zmw: z.number(),
  subtotal_zmw: z.number(),
  margin_pct: z.number(),
  final_price_zmw: z.number(),
  deposit_zmw: z.number(),
  balance_zmw: z.number(),
  fx_cny_zmw: z.number(),
  fx_usd_zmw: z.number(),
  weight_kg: z.number(),
})

// ================ ProductRequest DTO ================

export const ProductRequestDTOSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid().nullable(),
  raw_text: z.string().nullable(),
  image_url: z.string().nullable(),
  ai_keywords: z.string().nullable(),
  status: z.enum(PRODUCT_REQUEST_STATUSES),
  matched_sku_id: z.string().nullable(),
  created_at: z.string().or(z.date()),
})
export type ProductRequestDTO = z.infer<typeof ProductRequestDTOSchema>

// ================ MatchCandidate ================

export const MatchCandidateSchema = z.object({
  shopify_product_id: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  price_zmw: z.number(),
  image_url: z.string().nullable(),
  similarity: z.number(),
  in_stock: z.boolean(),
})

// ================ Intent classification result ================

export const IntentResultSchema = z.object({
  intent: z.enum(INTENTS),
  confidence: z.number().min(0).max(1),
})
export type IntentResult = z.infer<typeof IntentResultSchema>

// ================ Message DTO ================

export const MessageDTOSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid().nullable(),
  direction: z.enum(['inbound', 'outbound']),
  type: z.enum(MESSAGE_TYPES),
  content: z.string().nullable(),
  intent: z.string().nullable(),
  agent: z.string().nullable(),
  is_ai: z.boolean(),
  created_at: z.string().or(z.date()),
})
export type MessageDTO = z.infer<typeof MessageDTOSchema>

// ================ Order DTO ================

export const OrderDTOSchema = z.object({
  id: z.string().uuid(),
  order_code: z.string(),
  customer_id: z.string().uuid().nullable(),
  total_zmw: z.string().or(z.number()),
  deposit_zmw: z.string().or(z.number()),
  balance_zmw: z.string().or(z.number()),
  status: z.enum(ORDER_STATUSES),
  created_at: z.string().or(z.date()),
})
export type OrderDTO = z.infer<typeof OrderDTOSchema>
