import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { CATEGORY_SUBTITLES } from '@/lib/constants'

interface Product {
  id: string
  title: string
  category: string | null
  priceZmw: number | string | null
  imageUrls: string[] | null
}

interface Props {
  category: string
  products: Product[]
}

export function CategorySection({ category, products }: Props) {
  if (products.length === 0) return null

  const subtitle = CATEGORY_SUBTITLES[category] ?? ''

  return (
    <section className="rounded-2xl bg-surface-container-low p-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-display text-on-surface">{category}</h3>
          {subtitle && (
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        <Link
          href={`/products?category=${category}`}
          className="text-xs font-medium text-primary"
        >
          More &gt;
        </Link>
      </div>

      {/* Product grid — 2 columns, up to 4 items */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((p) => (
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
