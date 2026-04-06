import type { FastifyInstance } from 'fastify'
import { env } from '../config.js'
import { logger } from '../logger.js'
import { verifySignature } from '../lib/signature.js'
import { WatiWebhookPayloadSchema } from '@zamgo/shared'
import { upsertCustomer } from '../domain/customer.js'
import { insertMessage } from '../domain/messages.js'
import { getInboundQueue } from '../queue/index.js'

export async function registerWatiWebhook(app: FastifyInstance) {
  // We need the raw body to verify HMAC. Fastify already exposes req.body parsed —
  // attach a rawBody via pre-parsing hook.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      try {
        ;(req as unknown as { rawBody: string }).rawBody = body as string
        const parsed = JSON.parse(body as string)
        done(null, parsed)
      } catch (err) {
        done(err as Error, undefined)
      }
    },
  )

  app.post('/api/wati/webhook', async (req, reply) => {
    const rawBody = (req as unknown as { rawBody: string }).rawBody ?? ''
    const signature = req.headers['x-wati-signature'] as string | undefined

    if (!verifySignature(rawBody, signature, env.WATI_WEBHOOK_SECRET)) {
      logger.warn({ hasSig: Boolean(signature) }, 'webhook: signature invalid')
      return reply.code(401).send({ error: 'invalid signature' })
    }

    const parsed = WatiWebhookPayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'webhook: payload invalid')
      return reply.code(400).send({ error: 'invalid payload' })
    }
    const msg = parsed.data

    // Convert raw waId to +E.164 with '+' prefix
    const waPhone = msg.waId.startsWith('+') ? msg.waId : `+${msg.waId}`

    try {
      const customer = await upsertCustomer(waPhone, msg.senderName ?? '')
      const saved = await insertMessage({
        customerId: customer.id,
        direction: 'inbound',
        type: msg.type,
        content: msg.text ?? null,
        mediaUrl: msg.mediaUrl ?? null,
        waMessageId: msg.messageId ?? null,
      })
      logger.info(
        {
          customerId: customer.id,
          waPhone: customer.waPhone,
          msgId: saved.id,
          text: msg.text?.slice(0, 80),
        },
        'webhook: signature OK, customer upserted, message inserted',
      )

      await getInboundQueue().add('process-inbound', {
        messageId: saved.id,
        customerId: customer.id,
        rawText: msg.text ?? '',
        imageUrl: msg.mediaUrl ?? null,
      })

      return reply.code(200).send({ received: true })
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'webhook: processing error')
      return reply.code(500).send({ error: 'processing failed' })
    }
  })
}
