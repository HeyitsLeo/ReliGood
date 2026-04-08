-- Change vector dimension from 1536 to 1024 (Qwen text-embedding-v3 max dim)
-- Drop old indexes first
DROP INDEX IF EXISTS idx_pr_embedding;
DROP INDEX IF EXISTS idx_spc_embedding;

-- Alter columns
ALTER TABLE product_requests ALTER COLUMN embedding TYPE vector(1024) USING NULL;
ALTER TABLE shopify_products_cache ALTER COLUMN embedding TYPE vector(1024) USING NULL;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_pr_embedding ON product_requests
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_spc_embedding ON shopify_products_cache
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
