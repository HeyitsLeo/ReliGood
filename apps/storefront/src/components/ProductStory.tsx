import { CATEGORY_STORIES } from '@/lib/constants'

interface Props {
  category: string | null | undefined
}

export function ProductStory({ category }: Props) {
  if (!category) return null

  const catKey = category.split('_')[0]
  const stories = CATEGORY_STORIES[category] ?? CATEGORY_STORIES[catKey]
  if (!stories || stories.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">Why Choose This Product</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {stories.map((card, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
          >
            <h3 className="font-medium text-on-surface">{card.heading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
