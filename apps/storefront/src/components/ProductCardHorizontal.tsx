import Link from 'next/link'
import { ImageWithFallback } from './ImageWithFallback'
import { PriceTag } from './PriceTag'

interface Props {
  id: string
  title: string
  description?: string | null
  price: number | string
  imageUrl: string | null | undefined
}

export function ProductCardHorizontal({ id, title, description, price, imageUrl }: Props) {
  return (
    <Link
      href={`/products/${id}`}
      className="flex gap-3 rounded-xl shadow-ambient bg-surface-container-lowest p-2 transition-shadow hover:shadow-md"
    >
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        className="h-24 w-24 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="text-sm font-medium text-on-surface line-clamp-2">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-1">{description}</p>
          )}
        </div>
        <PriceTag price={price} className="text-sm" />
      </div>
    </Link>
  )
}
