/**
 * Mock OpenAI adapter for local dev.
 * - chat: returns fixed JSON shaped by intent heuristics
 * - vision: returns canned keywords based on filename hints
 * - embed: delegates to the deterministic hash-based embedding (packages/db/mock-embed)
 *
 * Swap to real OpenAI by setting ADAPTER_MODE=real.
 */
import { mockEmbed } from '@zamgo/db/mock-embed'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  content: string
}

export interface VisionResponse {
  keywords: string
  description: string
}

export async function chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<ChatResponse> {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? ''
  if (opts?.json) {
    // Simple JSON classifier fallback
    let intent = 'unknown'
    if (/\b(price|how much|buy|want|need|vacuum|cooker|lotion|earbuds|airfryer)\b/i.test(last))
      intent = 'product_inquiry'
    else if (/\b(where|status|track|arrive|ord-\d+)\b/i.test(last)) intent = 'order_status'
    else if (/\b(pay|airtel|deposit|mtn)\b/i.test(last)) intent = 'payment_help'
    else if (/\b(broken|refund|scam|angry|damaged)\b/i.test(last)) intent = 'complaint'
    else if (/^(hi|hello|hey|morning)\b/i.test(last)) intent = 'greeting'
    else if (/\b(how long|days|location|open|hours)\b/i.test(last)) intent = 'faq'
    return { content: JSON.stringify({ intent, confidence: 0.7 }) }
  }
  // Plain text response (quote rendering, faq answer, etc.)
  return { content: 'Got it 👍 our team will follow up shortly.' }
}

export async function vision(imageUrl: string): Promise<VisionResponse> {
  // Derive keywords from URL/path hint
  const lower = imageUrl.toLowerCase()
  if (lower.includes('vacuum') || lower.includes('roomba')) {
    return { keywords: 'robot vacuum cleaner white round floor', description: 'white round robot vacuum' }
  }
  if (lower.includes('rice')) {
    return { keywords: 'rice cooker kitchen electric 5l', description: 'electric rice cooker' }
  }
  if (lower.includes('earbud') || lower.includes('airpod')) {
    return { keywords: 'wireless earbuds bluetooth earphones', description: 'wireless earbuds' }
  }
  if (lower.includes('fryer')) {
    return { keywords: 'air fryer kitchen oil-free', description: 'digital air fryer' }
  }
  if (lower.includes('lotion') || lower.includes('cream')) {
    return { keywords: 'face cream lotion moisturizer skincare beauty', description: 'moisturizing cream' }
  }
  if (lower.includes('phone') || lower.includes('tv')) {
    return { keywords: 'electronics device screen', description: 'electronic device' }
  }
  return { keywords: 'unknown item', description: 'unclear product image' }
}

export async function embed(text: string): Promise<number[]> {
  return mockEmbed(text)
}
