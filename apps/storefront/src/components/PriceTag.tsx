import { formatPrice } from '@/lib/format'

interface Props {
  price: number | string
  className?: string
}

export function PriceTag({ price, className = '' }: Props) {
  return (
    <span className={`font-bold text-accent ${className}`}>
      {formatPrice(price)}
    </span>
  )
}
