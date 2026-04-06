import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://zamgo:zamgo_dev@localhost:5432/zamgo',
  },
  verbose: true,
  strict: true,
} satisfies Config
