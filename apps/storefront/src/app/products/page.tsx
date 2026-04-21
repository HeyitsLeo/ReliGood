'use client'
import { Suspense, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { SearchBar } from '@/components/SearchBar'
import { SortTabs, type SortKey } from '@/components/SortTabs'
import { CategorySidebar } from '@/components/CategorySidebar'
import { ProductCardHorizontal } from '@/components/ProductCardHorizontal'
import { ProductCard } from '@/components/ProductCard'
import { CATEGORY_MAP } from '@/lib/constants'

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') ?? 'All'
  const initialQuery = searchParams.get('q') ?? ''
  const [active, setActive] = useState(initialCategory)
  const [sort, setSort] = useState<SortKey>('all')
  const [search, setSearch] = useState(initialQuery)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: products, isLoading } = trpc.storefront.products.useQuery()

  const filtered = useMemo(() => {
    let list = products ?? []

    // Category filter
    if (active !== 'All') {
      list = list.filter((p) => {
        const display = p.category ? CATEGORY_MAP[p.category] ?? p.category : null
        return display === active
      })
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }

    // Sort
    if (sort === 'price') {
      list = [...list].sort(
        (a, b) => Number(a.priceZmw ?? 0) - Number(b.priceZmw ?? 0),
      )
    } else if (sort === 'newest') {
      list = [...list].sort(
        (a, b) =>
          new Date(b.syncedAt ?? 0).getTime() -
          new Date(a.syncedAt ?? 0).getTime(),
      )
    }

    return list
  }, [products, active, search, sort])

  const clearFilters = () => {
    setSearch('')
    setActive('All')
    setSort('all')
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <SearchBar onSearch={setSearch} defaultValue={initialQuery} />
      </div>

      {/* Main: sidebar + list */}
      <div className="flex flex-1">
        <CategorySidebar active={active} onSelect={setActive} />

        <div className="flex-1 p-3">
          {/* Sort tabs + view toggle */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex-1">
              <SortTabs active={sort} onSelect={setSort} />
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
                aria-label="List view"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
                aria-label="Grid view"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>

          {isLoading ? (
            viewMode === 'list' ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl bg-surface-container"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] animate-pulse rounded-xl bg-surface-container"
                  />
                ))}
              </div>
            )
          ) : filtered.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-2">
                {filtered.map((p) => (
                  <ProductCardHorizontal
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    description={p.description}
                    price={p.priceZmw ?? 0}
                    imageUrl={p.imageUrls?.[0]}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    category={p.category ?? null}
                    price={p.priceZmw ?? 0}
                    imageUrl={p.imageUrls?.[0]}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-16 w-16 text-on-surface-variant/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-on-surface">No products found</p>
              <p className="mt-1 text-sm text-on-surface-variant">Try a different search or category</p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-container transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8">
          <div className="h-10 w-full animate-pulse rounded-full bg-surface-container" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-surface-container"
              />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
