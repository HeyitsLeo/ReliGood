import { getDb } from '@zamgo/db'
import { config as configTbl, categoryWeightDefaults } from '@zamgo/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { ConfigBag, ConfigKey } from '@zamgo/shared'
import { CONFIG_SCHEMAS } from '@zamgo/shared'

// In-memory TTL cache (Redis-backed in prod; for MVP process-local is fine)
const cache = new Map<string, { value: unknown; expires: number }>()
const TTL_MS = 30_000

export async function loadConfig<K extends ConfigKey>(
  keys: K[],
): Promise<Pick<ConfigBag, K>> {
  const db = getDb()
  const missing: K[] = []
  const result: Record<string, unknown> = {}
  const now = Date.now()

  for (const key of keys) {
    const entry = cache.get(key)
    if (entry && entry.expires > now) {
      result[key] = entry.value
    } else {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const rows = await db
      .select()
      .from(configTbl)
      .where(inArray(configTbl.key, missing as string[]))
    for (const row of rows) {
      const schema = CONFIG_SCHEMAS[row.key as ConfigKey]
      if (!schema) continue
      const parsed = schema.parse(row.value)
      cache.set(row.key, { value: parsed, expires: now + TTL_MS })
      result[row.key] = parsed
    }
  }

  return result as Pick<ConfigBag, K>
}

export async function loadAllConfig() {
  const db = getDb()
  const rows = await db.select().from(configTbl)
  return rows
}

export async function updateConfig(key: string, value: unknown) {
  const db = getDb()
  await db
    .insert(configTbl)
    .values({ key, value: value as object })
    .onConflictDoUpdate({
      target: configTbl.key,
      set: { value: value as object, updatedAt: new Date() },
    })
  cache.delete(key)
}

export async function loadCategoryWeight(category: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(categoryWeightDefaults)
    .where(eq(categoryWeightDefaults.category, category))
    .limit(1)
  if (rows.length > 0) return rows[0]!
  // fallback to 'default'
  const fallback = await db
    .select()
    .from(categoryWeightDefaults)
    .where(eq(categoryWeightDefaults.category, 'default'))
    .limit(1)
  return fallback[0] ?? { category: 'default', defaultKg: '1.0', defaultShipMultiplier: '1.0' }
}

export function invalidateConfigCache() {
  cache.clear()
}
