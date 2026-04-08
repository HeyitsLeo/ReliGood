import Fastify from 'fastify'
import { env } from './config.js'
import { logger } from './logger.js'
import { registerWhatsAppWebhook } from './api/whatsapp-webhook.js'
import { registerTwilioWebhook } from './api/twilio-webhook.js'
import { registerHealth } from './api/health.js'
import { registerTrpc } from './api/trpc.js'
import { closeDb } from '@zamgo/db'
import { shutdownQueue } from './queue/index.js'

async function bootstrap() {
  const app = Fastify({
    logger: false, // we use pino directly via app.log replacement
    bodyLimit: 2 * 1024 * 1024,
  })

  // CORS for admin dev server
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'content-type,x-hub-signature-256,x-twilio-signature')
    if (req.method === 'OPTIONS') return reply.code(204).send()
  })

  await registerHealth(app)
  await registerWhatsAppWebhook(app)
  await registerTwilioWebhook(app)
  await registerTrpc(app)

  const port = env.BACKEND_PORT
  await app.listen({ port, host: '0.0.0.0' })
  logger.info({ port, mode: env.ADAPTER_MODE }, 'backend listening')

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down')
    try {
      await app.close()
      await shutdownQueue()
      await closeDb()
    } catch (e) {
      logger.error({ err: e }, 'shutdown error')
    }
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  logger.error({ err }, 'bootstrap failed')
  process.exit(1)
})
