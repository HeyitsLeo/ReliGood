import { z } from 'zod'
import { INTENTS, PRODUCT_REQUEST_STATUSES, ORDER_STATUSES, MESSAGE_TYPES } from './types.js'

// ================ WhatsApp Cloud API webhook ================

const WhatsAppProfileSchema = z.object({
  name: z.string().optional().default(''),
})

const WhatsAppContactSchema = z.object({
  profile: WhatsAppProfileSchema.optional(),
  wa_id: z.string(),
})

const WhatsAppTextSchema = z.object({ body: z.string() })
const WhatsAppImageSchema = z.object({ id: z.string(), mime_type: z.string().optional(), caption: z.string().optional() })
const WhatsAppAudioSchema = z.object({ id: z.string(), mime_type: z.string().optional() })
const WhatsAppListReplySchema = z.object({ id: z.string(), title: z.string(), description: z.string().optional() })
const WhatsAppInteractiveSchema = z.object({ type: z.string(), list_reply: WhatsAppListReplySchema.optional() })

const WhatsAppMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['text', 'image', 'audio', 'interactive', 'video', 'document', 'sticker', 'location', 'contacts', 'reaction', 'order', 'system', 'unknown']),
  text: WhatsAppTextSchema.optional(),
  image: WhatsAppImageSchema.optional(),
  audio: WhatsAppAudioSchema.optional(),
  interactive: WhatsAppInteractiveSchema.optional(),
})

const WhatsAppMetadataSchema = z.object({
  display_phone_number: z.string().optional(),
  phone_number_id: z.string(),
})

const WhatsAppValueSchema = z.object({
  messaging_product: z.string(),
  metadata: WhatsAppMetadataSchema,
  contacts: z.array(WhatsAppContactSchema).optional(),
  messages: z.array(WhatsAppMessageSchema).optional(),
  statuses: z.array(z.any()).optional(),
})

const WhatsAppChangeSchema = z.object({
  value: WhatsAppValueSchema,
  field: z.string(),
})

const WhatsAppEntrySchema = z.object({
  id: z.string(),
  changes: z.array(WhatsAppChangeSchema),
})

export const WhatsAppCloudWebhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(WhatsAppEntrySchema),
})
export type WhatsAppCloudWebhook = z.infer<typeof WhatsAppCloudWebhookSchema>
export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>

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
