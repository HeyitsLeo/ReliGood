import { CATEGORY_MAP, CATEGORY_WEIGHTS, DELIVERY_INFO } from '@/lib/constants'
import { extractBrand } from '@/lib/product-utils'

interface Props {
  category: string | null | undefined
  tags: string[] | null | undefined
}

export function ProductSpecs({ category, tags }: Props) {
  const brand = extractBrand(tags)

  const specs: { label: string; value: string }[] = []

  if (category) {
    specs.push({ label: 'Category', value: CATEGORY_MAP[category] ?? category })
  }
  if (brand) {
    specs.push({ label: 'Brand', value: brand })
  }
  if (category && CATEGORY_WEIGHTS[category]) {
    specs.push({ label: 'Est. Weight', value: CATEGORY_WEIGHTS[category] })
  }
  specs.push({ label: 'Condition', value: 'Brand New' })
  specs.push({ label: 'Source', value: 'Direct from manufacturer' })
  specs.push({ label: 'Delivery', value: DELIVERY_INFO })

  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">Specifications</h2>
      <div className="mt-3 overflow-hidden rounded-lg">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`flex justify-between px-4 py-2.5 ${
              i % 2 === 0 ? 'bg-surface-container-low' : ''
            }`}
          >
            <span className="text-sm text-on-surface-variant">{spec.label}</span>
            <span className="text-sm font-medium text-on-surface">{spec.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
