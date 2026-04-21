import { UNIVERSAL_FAQS, CATEGORY_FAQS, WHATSAPP_NUMBER } from '@/lib/constants'

interface Props {
  category: string | null | undefined
}

export function ProductFAQ({ category }: Props) {
  const catKey = category?.split('_')[0] ?? ''
  const catFaqs = CATEGORY_FAQS[category ?? ''] ?? CATEGORY_FAQS[catKey] ?? []
  const allFaqs = [...catFaqs, ...UNIVERSAL_FAQS]

  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">Frequently Asked Questions</h2>
      <div className="mt-4 space-y-2">
        {allFaqs.map((faq, i) => (
          <details key={i} className="group rounded-lg bg-surface-container-lowest shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-on-surface">
              {faq.q}
              <svg
                className="h-4 w-4 flex-shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="px-4 pb-3 text-sm leading-relaxed text-on-surface-variant">
              {faq.a}
            </p>
          </details>
        ))}
        {/* Last item: WhatsApp CTA */}
        <details className="group rounded-lg bg-surface-container-lowest shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-primary">
            Have another question?
            <svg
              className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <p className="px-4 pb-3 text-sm text-on-surface-variant">
            We&apos;re happy to help!{' '}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi ReliGood! I have a question about a product.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Ask us on WhatsApp →
            </a>
          </p>
        </details>
      </div>
    </section>
  )
}
