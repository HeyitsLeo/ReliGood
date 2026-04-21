import Link from 'next/link'
import { ImageWithFallback } from './ImageWithFallback'
import { formatPrice } from '@/lib/format'
import { WHATSAPP_NUMBER, CATEGORY_MAP } from '@/lib/constants'

interface Props {
  id: string
  title: string
  description: string | null
  category: string | null
  price: number | string
  imageUrl: string | null | undefined
}

export function PremiumProductCard({ id, title, description, category, price, imageUrl }: Props) {
  const displayCategory = category ? CATEGORY_MAP[category] ?? category : null
  const waText = encodeURIComponent(`Hi, I'm interested in: ${title}`)
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/products/${id}`} className="relative overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          In Stock
        </span>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {displayCategory && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
            {displayCategory}
          </span>
        )}
        <Link href={`/products/${id}`}>
          <h3 className="mt-1 text-lg font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        {description && (
          <p className="mt-1 text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Retail Price
          </span>
          <p className="text-xl font-bold text-accent">{formatPrice(price)}</p>
        </div>

        {/* CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Order via WhatsApp
        </a>
      </div>
    </div>
  )
}
