-- ivfflat indexes on vector(1536) columns
-- lists=100 is appropriate for <100k rows. Rebuild with higher lists in production.
CREATE INDEX IF NOT EXISTS idx_pr_embedding ON product_requests
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_spc_embedding ON shopify_products_cache
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
