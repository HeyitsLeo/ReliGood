'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { PremiumProductCard } from './PremiumProductCard'
import { CATEGORIES, CATEGORY_MAP } from '@/lib/constants'

const HOMEPAGE_LIMIT = 12

export function ProductGridSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const { data: products, isLoading } = trpc.storefront.products.useQuery()

  const filtered = useMemo(() => {
    if (!products) return []
    if (activeCategory === 'All') return products.slice(0, HOMEPAGE_LIMIT)

    return products
      .filter((p) => {
        const display = p.category ? CATEGORY_MAP[p.category] ?? p.category : 'Other'
        return display === activeCategory
      })
      .slice(0, HOMEPAGE_LIMIT)
  }, [products, activeCategory])

  return (
    <section className="px-4">
      {/* Header row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface">Our Products</h2>
          {products && (
            <p className="mt-1 text-sm text-on-surface-variant">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              {activeCategory !== 'All' && ` in ${activeCategory}`}
            </p>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-on-surface-variant">No products found in this category.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PremiumProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                description={p.description}
                category={p.category}
                price={p.priceZmw ?? 0}
                imageUrl={p.imageUrls?.[0]}
              />
            ))}
          </div>

          {/* View All link */}
          {products && products.length > HOMEPAGE_LIMIT && (
            <div className="mt-8 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View All Products →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
