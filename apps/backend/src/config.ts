import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Load from monorepo root .env
loadEnv({ path: join(__dirname, '..', '..', '..', '.env') })
// Also allow apps/backend/.env
loadEnv({ path: join(__dirname, '..', '.env') })

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  ADAPTER_MODE: z.enum(['mock', 'real']).default('mock'),
  LOG_LEVEL: z.string().default('info'),
  BACKEND_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default('postgresql://zamgo:zamgo_dev@localhost:5432/zamgo'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default('000000000000000'),
  WHATSAPP_ACCESS_TOKEN: z.string().default('mock-wa-token'),
  WHATSAPP_APP_SECRET: z.string().default('dev-secret'),
  WHATSAPP_VERIFY_TOKEN: z.string().default('zamgo-verify-token'),
  OPENAI_API_KEY: z.string().default('mock-openai-key'),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_VISION_MODEL: z.string().default('gpt-4o'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_WHATSAPP_NUMBER: z.string().default('+14155238886'),
})

export const env = EnvSchema.parse(process.env)
export type Env = typeof env
