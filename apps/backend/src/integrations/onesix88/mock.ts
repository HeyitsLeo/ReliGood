import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(__dirname, '..', '..', '..', '..', '..', 'fixtures', 'onesix88-catalog.json')

export interface OneSix88Offer {
  offerId: string
  title_cn: string
  title_en: string
  price_cny: number
  weight_kg: number
  image_url: string
  source_url: string
  keywords: string[]
}

let cache: OneSix88Offer[] | null = null
async function loadCatalog(): Promise<OneSix88Offer[]> {
  if (!cache) {
    const raw = await readFile(FIXTURE, 'utf8')
    cache = JSON.parse(raw) as OneSix88Offer[]
  }
  return cache
}

/** Fuzzy keyword-overlap search, returns top N offers. */
export async function searchOffers(keyword: string, limit = 3): Promise<OneSix88Offer[]> {
  const catalog = await loadCatalog()
  const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean)
  const scored = catalog.map((offer) => {
    let score = 0
    for (const tok of tokens) {
      if (offer.keywords.some((k) => k.toLowerCase().includes(tok) || tok.includes(k.toLowerCase()))) {
        score += 1
      }
      if (offer.title_en.toLowerCase().includes(tok)) score += 0.5
    }
    return { offer, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => s.offer)
}
