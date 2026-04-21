import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://zamgo:zamgo_dev@127.0.0.1:5432/zamgo'

export type DbClient = ReturnType<typeof drizzle<typeof schema>>

let _sql: ReturnType<typeof postgres> | null = null
let _db: DbClient | null = null

export function getDb(): DbClient {
  if (!_db) {
    const poolMax = Number(process.env.DB_POOL_MAX ?? 20)
    _sql = postgres(DATABASE_URL, { max: poolMax })
    _db = drizzle(_sql, { schema })
  }
  return _db
}

export function getSql() {
  if (!_sql) getDb()
  return _sql!
}

export async function closeDb() {
  if (_sql) {
    await _sql.end()
    _sql = null
    _db = null
  }
}

export { schema }
