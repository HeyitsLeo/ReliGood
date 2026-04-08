/**
 * Real WhatsApp Cloud API adapter.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import { env } from '../../config.js'
import { logger } from '../../logger.js'
import type { InteractiveListItem } from './mock.js'

const API_BASE = 'https://graph.facebook.com/v21.0'

async function graphPost(path: string, body: object): Promise<unknown> {
  const url = `${API_BASE}/${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    logger.error({ status: res.status, body: text }, 'WhatsApp API error')
    throw new Error(`WhatsApp API ${res.status}: ${text}`)
  }
  return res.json()
}

export async function sendText(waPhone: string, text: string): Promise<{ messageId: string }> {
  const phone = waPhone.replace(/^\+/, '')
  const data = (await graphPost(`${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: text },
  })) as { messages?: Array<{ id: string }> }
  const messageId = data.messages?.[0]?.id ?? `wa-${Date.now()}`
  logger.info({ to: phone, messageId }, '[whatsapp] sendText')
  return { messageId }
}

export async function sendInteractiveList(
  waPhone: string,
  header: string,
  body: string,
  items: InteractiveListItem[],
): Promise<{ messageId: string }> {
  const phone = waPhone.replace(/^\+/, '')
  const rows = items.map((item) => ({
    id: item.id,
    title: item.title.slice(0, 24),
    description: item.description?.slice(0, 72) ?? '',
  }))
  const data = (await graphPost(`${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: header.slice(0, 60) },
      body: { text: body.slice(0, 1024) },
      action: {
        button: 'View options',
        sections: [{ title: 'Options', rows }],
      },
    },
  })) as { messages?: Array<{ id: string }> }
  const messageId = data.messages?.[0]?.id ?? `wa-${Date.now()}`
  logger.info({ to: phone, messageId, itemCount: items.length }, '[whatsapp] sendInteractiveList')
  return { messageId }
}

export async function getMediaUrl(mediaId: string): Promise<string> {
  const url = `${API_BASE}/${mediaId}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WhatsApp media API ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { url?: string }
  if (!data.url) throw new Error(`No URL in media response for ${mediaId}`)
  return data.url
}
