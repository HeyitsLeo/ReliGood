'use client'
import { CATEGORIES } from '@/lib/constants'

interface Props {
  active?: string
  onSelect?: (cat: string) => void
}

export function CategoryScroller({ active = 'All', onSelect }: Props) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect?.(cat)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-primary text-white'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
