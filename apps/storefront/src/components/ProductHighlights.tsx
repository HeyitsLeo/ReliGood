import { generateHighlights } from '@/lib/product-utils'

interface Props {
  description: string | null | undefined
  tags: string[] | null | undefined
  category: string | null | undefined
}

export function ProductHighlights({ description, tags, category }: Props) {
  const highlights = generateHighlights(description, tags, category)

  if (highlights.length === 0) return null

  return (
    <ul className="space-y-2">
      {highlights.map((h, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-sm text-on-surface-variant">{h}</span>
        </li>
      ))}
    </ul>
  )
}
