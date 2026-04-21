'use client'
import { CATEGORIES } from '@/lib/constants'

interface Props {
  active: string
  onSelect: (cat: string) => void
}

export function CategorySidebar({ active, onSelect }: Props) {
  return (
    <div className="w-20 shrink-0 bg-surface-container-low">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`relative block w-full py-3 text-center text-xs transition-colors ${
            active === cat
              ? 'bg-surface-container-lowest font-medium text-primary'
              : 'text-on-surface-variant'
          }`}
        >
          {active === cat && (
            <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r bg-primary" />
          )}
          {cat}
        </button>
      ))}
    </div>
  )
}
