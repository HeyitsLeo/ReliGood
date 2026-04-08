/**
 * Twilio WhatsApp Sandbox adapter.
 * Docs: https://www.twilio.com/docs/whatsapp/sandbox
 */
import { env } from '../../config.js'
import { logger } from '../../logger.js'
import type { InteractiveListItem } from './mock.js'

const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`

function basicAuth(): string {
  return 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')
}

async function twilioPost(to: string, body: string): Promise<string> {
  const fromNumber = env.TWILIO_WHATSAPP_NUMBER.replace(/^\+/, '')
  const toNumber = to.replace(/^\+/, '')
  const formBody = new URLSearchParams({
    From: `whatsapp:+${fromNumber}`,
    To: `whatsapp:+${toNumber}`,
    Body: body,
  })
  const res = await fetch(TWILIO_API, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    logger.error({ status: res.status, body: text }, 'Twilio API error')
    throw new Error(`Twilio API ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { sid?: string }
  return data.sid ?? `twilio-${Date.now()}`
}

export async function sendText(waPhone: string, text: string): Promise<{ messageId: string }> {
  const messageId = await twilioPost(waPhone, text)
  logger.info({ to: waPhone, messageId }, '[twilio] sendText')
  return { messageId }
}

export async function sendInteractiveList(
  waPhone: string,
  header: string,
  body: string,
  items: InteractiveListItem[],
): Promise<{ messageId: string }> {
  // Twilio doesn't support interactive list messages — format as text
  const lines = [`*${header}*`, '', body, '']
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    lines.push(`${i + 1}. ${item.title}`)
    if (item.description) lines.push(`   ${item.description}`)
  }
  lines.push('', '_Reply with the number of your choice._')
  const messageId = await twilioPost(waPhone, lines.join('\n'))
  logger.info({ to: waPhone, messageId, itemCount: items.length }, '[twilio] sendInteractiveList (as text)')
  return { messageId }
}

export async function getMediaUrl(mediaId: string): Promise<string> {
  // Twilio webhook provides MediaUrl directly — just return it
  return mediaId
}
