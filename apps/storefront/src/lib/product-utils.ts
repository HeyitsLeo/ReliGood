import { KNOWN_BRANDS, CATEGORY_FEATURES } from './constants'

/** Filter tags already in title, capitalize rest, join with " · " */
export function deriveSubtitle(tags: string[] | null | undefined, title: string): string {
  if (!tags || tags.length === 0) return ''
  const titleLower = title.toLowerCase()
  return tags
    .filter((t) => !titleLower.includes(t.toLowerCase()))
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .slice(0, 4)
    .join(' · ')
}

/** Match tags against known brand set, return first hit or null */
export function extractBrand(tags: string[] | null | undefined): string | null {
  if (!tags) return null
  for (const tag of tags) {
    if (KNOWN_BRANDS.has(tag.toLowerCase())) {
      return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
    }
  }
  return null
}

/** Build 3–5 highlight bullet strings from product data */
export function generateHighlights(
  description: string | null | undefined,
  tags: string[] | null | undefined,
  category: string | null | undefined,
): string[] {
  const highlights: string[] = []

  // 1. First sentence of description
  if (description) {
    const first = description.split(/[.!?]\s/)[0]?.trim()
    if (first && first.length > 10) {
      highlights.push(first.length > 80 ? first.slice(0, 77) + '...' : first)
    }
  }

  // 2. Brand tag
  const brand = extractBrand(tags)
  if (brand) {
    highlights.push(`Genuine ${brand} product`)
  }

  // 3. Category-specific feature
  if (category) {
    const catKey = category.split('_')[0]
    const feature = CATEGORY_FEATURES[catKey] ?? CATEGORY_FEATURES[category]
    if (feature) highlights.push(feature)
  }

  // 4. Material/feature tags
  if (tags) {
    const featureTags = tags.filter(
      (t) => !KNOWN_BRANDS.has(t.toLowerCase()) && t.length > 2,
    )
    for (const t of featureTags.slice(0, 2)) {
      if (highlights.length >= 4) break
      const cap = t.charAt(0).toUpperCase() + t.slice(1)
      if (!highlights.some((h) => h.toLowerCase().includes(t.toLowerCase()))) {
        highlights.push(cap)
      }
    }
  }

  // 5. Static sourcing bullet
  highlights.push('Sourced directly from verified manufacturers')

  return highlights.slice(0, 5)
}
