import { WhatsAppButton } from '@/components/WhatsAppButton'
import { BUSINESS_NAME, DELIVERY_INFO, DEPOSIT_PERCENT, PAYMENT_METHODS } from '@/lib/constants'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 md:py-12">
      <h1 className="text-3xl font-bold text-on-surface">About {BUSINESS_NAME}</h1>

      {/* Story */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-on-surface">Our Story</h2>
        <p className="mt-3 text-on-surface-variant leading-relaxed">
          {BUSINESS_NAME} bridges the gap between quality Chinese manufacturers and Zambian consumers.
          We carefully source products — from electronics and beauty items to clothing and home goods — and
          deliver them directly to Lusaka at fair prices.
        </p>
        <p className="mt-3 text-on-surface-variant leading-relaxed">
          Our entire ordering process happens through WhatsApp, making it simple and personal. Just browse
          our catalog, send us a message, and we handle the rest.
        </p>
      </section>

      {/* How It Works */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-on-surface">How It Works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Browse', desc: 'Explore our product catalog on this website.' },
            { step: '2', title: 'WhatsApp', desc: 'Send us your order via WhatsApp.' },
            { step: '3', title: 'Receive', desc: 'Get your products delivered in ~2 weeks.' },
          ].map((s) => (
            <div key={s.step} className="rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {s.step}
              </div>
              <h3 className="mt-2 font-medium text-on-surface">{s.title}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to buy — detailed steps */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-on-surface">How to Buy</h2>
        <ol className="mt-4 space-y-4">
          {[
            { title: 'Browse', desc: 'Explore our product catalog on this website.' },
            { title: 'Message Us', desc: 'Tap "Order via WhatsApp" on any product page to send us your order.' },
            { title: 'Pay Deposit', desc: `Pay a ${DEPOSIT_PERCENT}% deposit via Airtel Money or MTN to confirm your order.` },
            { title: 'We Source & Ship', desc: 'We order from our trusted suppliers in China and ship to Lusaka.' },
            { title: 'Collect & Pay Balance', desc: 'Pick up your order and pay the remaining balance.' },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium text-on-surface">{step.title}</h3>
                <p className="text-sm text-on-surface-variant">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Payment */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-on-surface">Payment Methods</h2>
        <ul className="mt-3 space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <li key={m} className="flex items-center gap-2 text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Delivery */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-on-surface">Delivery</h2>
        <p className="mt-3 text-on-surface-variant">
          Estimated delivery time: <strong>{DELIVERY_INFO}</strong>.
          We will notify you via WhatsApp at every step — from ordering to arrival.
        </p>
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-on-surface">Have Questions?</h2>
        <p className="mt-2 text-on-surface-variant">We&apos;re here to help. Reach out on WhatsApp anytime.</p>
        <div className="mt-4">
          <WhatsAppButton label="Chat with Us" />
        </div>
      </section>
    </div>
  )
}
