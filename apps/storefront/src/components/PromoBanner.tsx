import { BUSINESS_NAME, BUSINESS_TAGLINE } from '@/lib/constants'

export function PromoBanner() {
  return (
    <div className="mx-4 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-4 text-white">
      <h2 className="text-lg font-bold font-display">{BUSINESS_NAME}</h2>
      <p className="mt-0.5 text-sm text-white/80">{BUSINESS_TAGLINE}</p>
      <p className="mt-1 text-xs text-white/60">
        Browse &amp; order via WhatsApp. Delivery to Lusaka in ~2 weeks.
      </p>
    </div>
  )
}
