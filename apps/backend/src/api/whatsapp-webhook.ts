import type { FastifyInstance } from 'fastify'
import { env } from '../config.js'
import { logger } from '../logger.js'
import { verifySignature } from '../lib/signature.js'
import { WhatsAppCloudWebhookSchema, type WhatsAppMessage } from '@zamgo/shared'
import { upsertCustomer } from '../domain/customer.js'
import { insertMessage } from '../domain/messages.js'
import { getInboundQueue } from '../queue/index.js'
import { getMediaUrl } from '../integrations/whatsapp/index.js'

export async function registerWhatsAppWebhook(app: FastifyInstance) {
  // Preserve raw body for HMAC verification
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

  // GET — Meta subscription verification
  app.get('/api/whatsapp/webhook', async (req, reply) => {
    const query = req.query as Record<string, string>
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('webhook: subscription verified')
      return reply.code(200).type('text/plain').send(challenge)
    }
    logger.warn({ mode, hasToken: Boolean(token) }, 'webhook: verification failed')
    return reply.code(403).send({ error: 'verification failed' })
  })

  // POST — incoming messages
  app.post('/api/whatsapp/webhook', async (req, reply) => {
    const rawBody = (req as unknown as { rawBody: string }).rawBody ?? ''
    const signature = req.headers['x-hub-signature-256'] as string | undefined

    if (!verifySignature(rawBody, signature, env.WHATSAPP_APP_SECRET)) {
      logger.warn({ hasSig: Boolean(signature) }, 'webhook: signature invalid')
      return reply.code(401).send({ error: 'invalid signature' })
    }

    const parsed = WhatsAppCloudWebhookSchema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'webhook: payload invalid')
      return reply.code(400).send({ error: 'invalid payload' })
    }

    // Process each entry / change / message
    for (const entry of parsed.data.entry) {
      for (const change of entry.changes) {
        const { value } = change

        // Ignore status updates (read receipts, etc.)
        if (!value.messages || value.messages.length === 0) continue

        for (const waMsg of value.messages) {
          try {
            await handleMessage(waMsg, value.contacts)
          } catch (err) {
            logger.error({ err: (err as Error).message, msgId: waMsg.id }, 'webhook: message processing error')
          }
        }
      }
    }

    return reply.code(200).send({ received: true })
  })
}

async function handleMessage(
  waMsg: WhatsAppMessage,
  contacts?: Array<{ profile?: { name?: string }; wa_id: string }>,
) {
  const waPhone = waMsg.from.startsWith('+') ? waMsg.from : `+${waMsg.from}`
  const contactName = contacts?.find((c) => c.wa_id === waMsg.from)?.profile?.name ?? ''

  // Extract text and media URL based on message type
  let text = ''
  let mediaUrl: string | null = null
  let msgType: 'text' | 'image' | 'audio' | 'interactive' = 'text'

  switch (waMsg.type) {
    case 'text':
      text = waMsg.text?.body ?? ''
      msgType = 'text'
      break
    case 'image':
      msgType = 'image'
      text = waMsg.image?.caption ?? ''
      if (waMsg.image?.id) {
        try {
          mediaUrl = await getMediaUrl(waMsg.image.id)
        } catch (e) {
          logger.warn({ err: (e as Error).message, mediaId: waMsg.image.id }, 'failed to resolve media URL')
        }
      }
      break
    case 'audio':
      msgType = 'audio'
      if (waMsg.audio?.id) {
        try {
          mediaUrl = await getMediaUrl(waMsg.audio.id)
        } catch (e) {
          logger.warn({ err: (e as Error).message, mediaId: waMsg.audio.id }, 'failed to resolve media URL')
        }
      }
      break
    case 'interactive':
      msgType = 'interactive'
      text = waMsg.interactive?.list_reply?.title ?? ''
      break
    default:
      // Unsupported message types — log and skip
      logger.info({ type: waMsg.type, msgId: waMsg.id }, 'webhook: unsupported message type, skipping')
      return
  }

  const customer = await upsertCustomer(waPhone, contactName)
  const saved = await insertMessage({
    customerId: customer.id,
    direction: 'inbound',
    type: msgType,
    content: text || null,
    mediaUrl,
    waMessageId: waMsg.id,
  })

  logger.info(
    {
      customerId: customer.id,
      waPhone: customer.waPhone,
      msgId: saved.id,
      text: text?.slice(0, 80),
    },
    'webhook: message processed',
  )

  await getInboundQueue().add('process-inbound', {
    messageId: saved.id,
    customerId: customer.id,
    rawText: text,
    imageUrl: mediaUrl,
  })
}
