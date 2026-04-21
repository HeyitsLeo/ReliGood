'use client'
import { useState } from 'react'
import { SEARCH_PLACEHOLDER } from '@/lib/constants'

interface Props {
  onSearch?: (query: string) => void
  placeholder?: string
  defaultValue?: string
}

export function SearchBar({ onSearch, placeholder = SEARCH_PLACEHOLDER, defaultValue = '' }: Props) {
  const [query, setQuery] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearch?.(e.target.value.trim())
          }}
          placeholder={placeholder}
          className="w-full rounded-full bg-surface-container-high py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/20"
        />
      </div>
    </form>
  )
}
