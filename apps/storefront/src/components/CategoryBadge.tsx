import { CATEGORY_MAP } from '@/lib/constants'

interface Props {
  category: string | null
}

export function CategoryBadge({ category }: Props) {
  if (!category) return null
  const label = CATEGORY_MAP[category] ?? category
  return (
    <span className="inline-block rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
      {label}
    </span>
  )
}
