import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  customType,
  index,
  date,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ================= Custom vector(1536) type =================
// Drizzle doesn't natively support pgvector; wrap with customType.
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)'
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    // Value looks like "[0.1,0.2,...]"
    if (!value) return []
    const trimmed = value.replace(/^\[|\]$/g, '')
    if (!trimmed) return []
    return trimmed.split(',').map((s) => Number(s))
  },
})

// ================= 1. customers =================
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    waPhone: text('wa_phone').unique().notNull(),
    waName: text('wa_name'),
    preferredName: text('preferred_name'),
    language: text('language').default('en'),
    city: text('city').default('Lusaka'),
    tags: text('tags').array().default(sql`'{}'`),
    totalOrders: integer('total_orders').default(0),
    totalGmwZmw: numeric('total_gmv_zmw', { precision: 12, scale: 2 }).default('0'),
    blocked: boolean('blocked').default(false),
    lastMsgAt: timestamp('last_msg_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    waPhoneIdx: index('idx_customers_wa_phone').on(t.waPhone),
    lastMsgIdx: index('idx_customers_last_msg').on(t.lastMsgAt),
  }),
)

// ================= 6. cs_agents =================
export const csAgents = pgTable('cs_agents', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: text('name').notNull(),
  waPhone: text('wa_phone'),
  role: text('role').default('cs'),
  active: boolean('active').default(true),
  languages: text('languages').array().default(sql`'{en,zh}'`),
  maxConcurrent: integer('max_concurrent').default(15),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ================= 2. product_requests =================
export const productRequests = pgTable(
  'product_requests',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    customerId: uuid('customer_id').references(() => customers.id),
    rawText: text('raw_text'),
    imageUrl: text('image_url'),
    aiKeywords: text('ai_keywords'),
    embedding: vector('embedding'),
    status: text('status').notNull().default('new'),
    matchedSkuId: text('matched_sku_id'),
    assignedCsId: uuid('assigned_cs_id').references(() => csAgents.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerIdx: index('idx_pr_customer').on(t.customerId, t.createdAt),
    statusIdx: index('idx_pr_status').on(t.status),
  }),
)

// ================= 3. quotes =================
export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    requestId: uuid('request_id').references(() => productRequests.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    titleCn: text('title_cn'),
    titleEn: text('title_en'),
    imageUrl: text('image_url'),
    taobaoPriceCny: numeric('taobao_price_cny', { precision: 10, scale: 2 }),
    estWeightKg: numeric('est_weight_kg', { precision: 6, scale: 3 }),
    estShippingUsd: numeric('est_shipping_usd', { precision: 8, scale: 2 }),
    fxCnyZmw: numeric('fx_cny_zmw', { precision: 8, scale: 4 }),
    fxUsdZmw: numeric('fx_usd_zmw', { precision: 8, scale: 4 }),
    finalPriceZmw: numeric('final_price_zmw', { precision: 12, scale: 2 }).notNull(),
    depositZmw: numeric('deposit_zmw', { precision: 12, scale: 2 }).notNull(),
    profitMargin: numeric('profit_margin', { precision: 4, scale: 3 }).default('0.18'),
    etaDays: integer('eta_days').default(14),
    selected: boolean('selected').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    requestIdx: index('idx_quotes_request').on(t.requestId),
  }),
)

// ================= 4. temp_listings =================
export const tempListings = pgTable(
  'temp_listings',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    shopifyProductId: text('shopify_product_id').unique(),
    sourceUrl: text('source_url').notNull(),
    titleCn: text('title_cn'),
    titleEn: text('title_en'),
    category: text('category'),
    taobaoPriceCny: numeric('taobao_price_cny', { precision: 10, scale: 2 }),
    estWeightKg: numeric('est_weight_kg', { precision: 6, scale: 3 }),
    currentPriceZmw: numeric('current_price_zmw', { precision: 12, scale: 2 }),
    soldCount: integer('sold_count').default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    promoted: boolean('promoted').default(false),
    createdBy: uuid('created_by').references(() => csAgents.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    expiresIdx: index('idx_temp_expires').on(t.expiresAt),
  }),
)

// ================= 5. orders =================
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    orderCode: text('order_code').unique().notNull(),
    customerId: uuid('customer_id').references(() => customers.id),
    requestId: uuid('request_id').references(() => productRequests.id),
    quoteId: uuid('quote_id').references(() => quotes.id),
    shopifyOrderId: text('shopify_order_id').unique(),
    totalZmw: numeric('total_zmw', { precision: 12, scale: 2 }).notNull(),
    depositZmw: numeric('deposit_zmw', { precision: 12, scale: 2 }).notNull(),
    balanceZmw: numeric('balance_zmw', { precision: 12, scale: 2 }).notNull(),
    depositPaidAt: timestamp('deposit_paid_at', { withTimezone: true }),
    depositAirtelRef: text('deposit_airtel_ref'),
    balancePaidAt: timestamp('balance_paid_at', { withTimezone: true }),
    status: text('status').notNull().default('draft'),
    taobaoOrderNo: text('taobao_order_no'),
    trackingCn: text('tracking_cn'),
    trackingAir: text('tracking_air'),
    pickupCode: text('pickup_code'),
    pickupAt: timestamp('pickup_at', { withTimezone: true }),
    etaPickupDate: date('eta_pickup_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerIdx: index('idx_orders_customer').on(t.customerId, t.createdAt),
    statusIdx: index('idx_orders_status').on(t.status),
  }),
)

// ================= 7. shopify_products_cache =================
export const shopifyProductsCache = pgTable(
  'shopify_products_cache',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    shopifyProductId: text('shopify_product_id').unique().notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    priceZmw: numeric('price_zmw', { precision: 12, scale: 2 }),
    imageUrls: text('image_urls').array(),
    tags: text('tags').array(),
    isTemp: boolean('is_temp').default(false),
    inStock: boolean('in_stock').default(true),
    embedding: vector('embedding'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    categoryIdx: index('idx_spc_category').on(t.category),
  }),
)

// ================= 8. category_weight_defaults =================
export const categoryWeightDefaults = pgTable('category_weight_defaults', {
  category: text('category').primaryKey(),
  defaultKg: numeric('default_kg', { precision: 6, scale: 3 }).notNull(),
  defaultShipMultiplier: numeric('default_ship_multiplier', { precision: 3, scale: 2 }).default(
    '1.0',
  ),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ================= 9. config =================
export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => csAgents.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ================= 10. messages =================
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    customerId: uuid('customer_id').references(() => customers.id),
    direction: text('direction').notNull(),
    waMessageId: text('wa_message_id'),
    type: text('type').notNull(),
    content: text('content'),
    mediaUrl: text('media_url'),
    intent: text('intent'),
    agent: text('agent'),
    sentBy: uuid('sent_by').references(() => csAgents.id),
    isAi: boolean('is_ai').default(false),
    requestId: uuid('request_id').references(() => productRequests.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerTimeIdx: index('idx_messages_customer_time').on(t.customerId, t.createdAt),
  }),
)
