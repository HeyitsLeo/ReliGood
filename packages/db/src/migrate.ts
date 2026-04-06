/**
 * Custom migration runner that applies `.sql` files in `migrations/` alphabetically.
 * Simpler than drizzle's built-in since we need raw SQL for pgvector extension.
 */
import postgres from 'postgres'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations')

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://zamgo:zamgo_dev@localhost:5432/zamgo'

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 })

  // Ensure migrations tracking table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const applied = await sql`SELECT name FROM _migrations`
  const appliedSet = new Set(applied.map((r) => r.name))

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[migrate] skip  ${file}`)
      continue
    }
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`[migrate] apply ${file}`)
    try {
      await sql.unsafe(content)
      await sql`INSERT INTO _migrations (name) VALUES (${file})`
    } catch (e) {
      console.error(`[migrate] FAIL on ${file}:`, (e as Error).message)
      await sql.end()
      process.exit(1)
    }
  }

  console.log('[migrate] done')
  await sql.end()
}

main()
