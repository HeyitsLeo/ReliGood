import type { FastifyInstance } from 'fastify'
import { env } from '../config.js'
import { logger } from '../logger.js'
import { verifyTwilioSignature } from '../lib/signature.js'
import { upsertCustomer } from '../domain/customer.js'
import { insertMessage } from '../domain/messages.js'
import { getInboundQueue } from '../queue/index.js'

export async function registerTwilioWebhook(app: FastifyInstance) {
  // Parse application/x-www-form-urlencoded (Twilio sends this format)
  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        const params: Record<string, string> = {}
        for (const [k, v] of new URLSearchParams(body as string)) {
          params[k] = v
        }
        done(null, params)
      } catch (err) {
        done(err as Error, undefined)
      }
    },
  )

  app.post('/api/twilio/webhook', async (req, reply) => {
    const params = req.body as Record<string, string>
    const signature = req.headers['x-twilio-signature'] as string | undefined

    // Build the full URL Twilio used to compute the signature
    const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http'
    const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost'
    const webhookUrl = `${proto}://${host}${req.url}`

    if (env.TWILIO_AUTH_TOKEN && !verifyTwilioSignature(webhookUrl, params, signature, env.TWILIO_AUTH_TOKEN)) {
      logger.warn({ hasSig: Boolean(signature) }, 'twilio-webhook: signature invalid')
      return reply.code(401).send({ error: 'invalid signature' })
    }

    const waId = params.WaId ?? ''
    const profileName = params.ProfileName ?? ''
    const body = params.Body ?? ''
    const numMedia = parseInt(params.NumMedia ?? '0', 10)
    const messageSid = params.MessageSid ?? `twilio-${Date.now()}`

    if (!waId) {
      logger.warn('twilio-webhook: missing WaId')
      return reply.code(400).type('text/xml').send('<Response/>')
    }

    const waPhone = waId.startsWith('+') ? waId : `+${waId}`

    let mediaUrl: string | null = null
    let msgType: 'text' | 'image' = 'text'
    if (numMedia > 0 && params.MediaUrl0) {
      mediaUrl = params.MediaUrl0
      msgType = 'image'
    }

    try {
      const customer = await upsertCustomer(waPhone, profileName)
      const saved = await insertMessage({
        customerId: customer.id,
        direction: 'inbound',
        type: msgType,
        content: body || null,
        mediaUrl,
        waMessageId: messageSid,
      })

      logger.info(
        {
          customerId: customer.id,
          waPhone: customer.waPhone,
          msgId: saved.id,
          text: body?.slice(0, 80),
        },
        'twilio-webhook: message processed',
      )

      await getInboundQueue().add('process-inbound', {
        messageId: saved.id,
        customerId: customer.id,
        rawText: body,
        imageUrl: mediaUrl,
      })
    } catch (err) {
      logger.error({ err: (err as Error).message, messageSid }, 'twilio-webhook: processing error')
    }

    // Twilio requires empty TwiML response
    return reply.code(200).type('text/xml').send('<Response/>')
  })
}
