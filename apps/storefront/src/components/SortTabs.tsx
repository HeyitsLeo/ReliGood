'use client'

export type SortKey = 'all' | 'recommended' | 'price' | 'newest'

const TABS: { key: SortKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recommended', label: 'Popular' },
  { key: 'price', label: 'Price' },
  { key: 'newest', label: 'Newest' },
]

interface Props {
  active: SortKey
  onSelect: (key: SortKey) => void
}

export function SortTabs({ active, onSelect }: Props) {
  return (
    <div className="flex border-b border-outline-variant">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
            active === tab.key
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-surface-variant'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
