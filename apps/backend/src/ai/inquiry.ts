import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FAQ_FIXTURE = join(__dirname, '..', '..', '..', '..', 'fixtures', 'faq.json')

interface FaqEntry {
  keywords: string[]
  answer: string
}

let cache: FaqEntry[] | null = null

async function loadFaq(): Promise<FaqEntry[]> {
  if (!cache) {
    const raw = await readFile(FAQ_FIXTURE, 'utf8')
    cache = JSON.parse(raw) as FaqEntry[]
  }
  return cache
}

/** Match an FAQ answer by keyword overlap; null if no hit. */
export async function answerFaq(text: string): Promise<string | null> {
  const faqs = await loadFaq()
  const lower = text.toLowerCase()
  for (const entry of faqs) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) return entry.answer
    }
  }
  return null
}

export function greetingResponse(name: string): string {
  const first = (name || '').split(/\s+/)[0] || 'there'
  return `Hi ${first}! 👋 Welcome to ZamGo. Tell me what you're looking for, or send a photo and I'll find the price for you.`
}
