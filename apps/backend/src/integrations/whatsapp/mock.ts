/**
 * Mock WhatsApp adapter: appends messages to logs/outbound.jsonl and prints to console.
 */
import { appendFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { logger } from '../../logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOG_FILE = join(__dirname, '..', '..', '..', '..', '..', 'logs', 'outbound.jsonl')

export interface InteractiveListItem {
  id: string
  title: string
  description?: string
}

async function appendJsonl(entry: object) {
  try {
    await mkdir(dirname(LOG_FILE), { recursive: true })
    await appendFile(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8')
  } catch (e) {
    logger.warn({ err: e }, 'failed to write outbound log')
  }
}

export async function sendText(waPhone: string, text: string): Promise<{ messageId: string }> {
  const messageId = `mock-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await appendJsonl({
    ts: new Date().toISOString(),
    to: waPhone,
    type: 'text',
    text,
    messageId,
  })
  logger.info({ to: waPhone, text: text.slice(0, 100) }, '[whatsapp-mock] sendText')
  return { messageId }
}

export async function sendInteractiveList(
  waPhone: string,
  header: string,
  body: string,
  items: InteractiveListItem[],
): Promise<{ messageId: string }> {
  const messageId = `mock-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await appendJsonl({
    ts: new Date().toISOString(),
    to: waPhone,
    type: 'interactive_list',
    header,
    body,
    items,
    messageId,
  })
  logger.info(
    { to: waPhone, header, itemCount: items.length },
    '[whatsapp-mock] sendInteractiveList',
  )
  return { messageId }
}

export async function getMediaUrl(mediaId: string): Promise<string> {
  logger.info({ mediaId }, '[whatsapp-mock] getMediaUrl')
  return `https://mock-cdn.example.com/media/${mediaId}`
}
