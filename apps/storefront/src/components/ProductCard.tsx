import Link from 'next/link'
import { ImageWithFallback } from './ImageWithFallback'
import { PriceTag } from './PriceTag'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  id: string
  title: string
  category: string | null
  price: number | string
  imageUrl: string | null | undefined
}

export function ProductCard({ id, title, category, price, imageUrl }: Props) {
  return (
    <Link
      href={`/products/${id}`}
      className="group block overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient active:scale-[0.98] transition-transform"
    >
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        className="aspect-[3/4] w-full object-cover"
      />
      <div className="p-3">
        <CategoryBadge category={category} />
        <h3 className="mt-1 text-sm font-medium text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <PriceTag price={price} className="mt-1 text-base" />
      </div>
    </Link>
  )
}
