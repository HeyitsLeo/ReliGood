-- ================== Extensions ==================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================== 1. customers ==================
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_phone        TEXT UNIQUE NOT NULL,
  wa_name         TEXT,
  preferred_name  TEXT,
  language        TEXT DEFAULT 'en',
  city            TEXT DEFAULT 'Lusaka',
  tags            TEXT[] DEFAULT '{}',
  total_orders    INT DEFAULT 0,
  total_gmv_zmw   NUMERIC(12,2) DEFAULT 0,
  blocked         BOOLEAN DEFAULT FALSE,
  last_msg_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_wa_phone ON customers(wa_phone);
CREATE INDEX IF NOT EXISTS idx_customers_last_msg ON customers(last_msg_at DESC);

-- ================== 6. cs_agents ==================
CREATE TABLE IF NOT EXISTS cs_agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  wa_phone        TEXT,
  role            TEXT DEFAULT 'cs',
  active          BOOLEAN DEFAULT TRUE,
  languages       TEXT[] DEFAULT '{en,zh}',
  max_concurrent  INT DEFAULT 15,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================== 2. product_requests ==================
CREATE TABLE IF NOT EXISTS product_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID REFERENCES customers(id),
  raw_text        TEXT,
  image_url       TEXT,
  ai_keywords     TEXT,
  embedding       vector(1536),
  status          TEXT NOT NULL DEFAULT 'new',
  matched_sku_id  TEXT,
  assigned_cs_id  UUID REFERENCES cs_agents(id),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pr_customer ON product_requests(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_status ON product_requests(status);

-- ================== 3. quotes ==================
CREATE TABLE IF NOT EXISTS quotes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id        UUID REFERENCES product_requests(id) ON DELETE CASCADE,
  source            TEXT NOT NULL,
  source_url        TEXT,
  title_cn          TEXT,
  title_en          TEXT,
  image_url         TEXT,
  taobao_price_cny  NUMERIC(10,2),
  est_weight_kg     NUMERIC(6,3),
  est_shipping_usd  NUMERIC(8,2),
  fx_cny_zmw        NUMERIC(8,4),
  fx_usd_zmw        NUMERIC(8,4),
  final_price_zmw   NUMERIC(12,2) NOT NULL,
  deposit_zmw       NUMERIC(12,2) NOT NULL,
  profit_margin     NUMERIC(4,3) DEFAULT 0.18,
  eta_days          INT DEFAULT 14,
  selected          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotes_request ON quotes(request_id);

-- ================== 4. temp_listings ==================
CREATE TABLE IF NOT EXISTS temp_listings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_product_id TEXT UNIQUE,
  source_url        TEXT NOT NULL,
  title_cn          TEXT,
  title_en          TEXT,
  category          TEXT,
  taobao_price_cny  NUMERIC(10,2),
  est_weight_kg     NUMERIC(6,3),
  current_price_zmw NUMERIC(12,2),
  sold_count        INT DEFAULT 0,
  expires_at        TIMESTAMPTZ NOT NULL,
  promoted          BOOLEAN DEFAULT FALSE,
  created_by        UUID REFERENCES cs_agents(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_temp_expires ON temp_listings(expires_at) WHERE promoted = FALSE;

-- ================== 5. orders ==================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code          TEXT UNIQUE NOT NULL,
  customer_id         UUID REFERENCES customers(id),
  request_id          UUID REFERENCES product_requests(id),
  quote_id            UUID REFERENCES quotes(id),
  shopify_order_id    TEXT UNIQUE,
  total_zmw           NUMERIC(12,2) NOT NULL,
  deposit_zmw         NUMERIC(12,2) NOT NULL,
  balance_zmw         NUMERIC(12,2) NOT NULL,
  deposit_paid_at     TIMESTAMPTZ,
  deposit_airtel_ref  TEXT,
  balance_paid_at     TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'draft',
  taobao_order_no     TEXT,
  tracking_cn         TEXT,
  tracking_air        TEXT,
  pickup_code         TEXT,
  pickup_at           TIMESTAMPTZ,
  eta_pickup_date     DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_eta ON orders(eta_pickup_date) WHERE status NOT IN ('completed','cancelled');

-- ================== 7. shopify_products_cache ==================
CREATE TABLE IF NOT EXISTS shopify_products_cache (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_product_id TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  price_zmw         NUMERIC(12,2),
  image_urls        TEXT[],
  tags              TEXT[],
  is_temp           BOOLEAN DEFAULT FALSE,
  in_stock          BOOLEAN DEFAULT TRUE,
  embedding         vector(1536),
  synced_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spc_category ON shopify_products_cache(category);

-- ================== 8. category_weight_defaults ==================
CREATE TABLE IF NOT EXISTS category_weight_defaults (
  category        TEXT PRIMARY KEY,
  default_kg      NUMERIC(6,3) NOT NULL,
  default_ship_multiplier NUMERIC(3,2) DEFAULT 1.0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================== 9. config ==================
CREATE TABLE IF NOT EXISTS config (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  updated_by      UUID REFERENCES cs_agents(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================== 10. messages ==================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID REFERENCES customers(id),
  direction       TEXT NOT NULL,
  wa_message_id   TEXT,
  type            TEXT NOT NULL,
  content         TEXT,
  media_url       TEXT,
  intent          TEXT,
  agent           TEXT,
  sent_by         UUID REFERENCES cs_agents(id),
  is_ai           BOOLEAN DEFAULT FALSE,
  request_id      UUID REFERENCES product_requests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_customer_time ON messages(customer_id, created_at DESC);
