'use client'
import { trpc } from '@/lib/trpc'
import { ProductCard } from './ProductCard'

interface Props {
  category: string | null | undefined
  excludeId: string
}

export function SimilarProducts({ category, excludeId }: Props) {
  const { data: products } = trpc.storefront.productsByCategory.useQuery(
    { category: category ?? '', excludeId, limit: 6 },
    { enabled: !!category },
  )

  if (!products || products.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">You May Also Like</h2>

      {/* Mobile: horizontal scroll */}
      <div className="hide-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-40 flex-shrink-0">
            <ProductCard
              id={p.id}
              title={p.title}
              category={p.category}
              price={p.priceZmw ?? 0}
              imageUrl={p.imageUrls?.[0]}
            />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="mt-4 hidden grid-cols-4 gap-4 md:grid">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            title={p.title}
            category={p.category}
            price={p.priceZmw ?? 0}
            imageUrl={p.imageUrls?.[0]}
          />
        ))}
      </div>
    </section>
  )
}
