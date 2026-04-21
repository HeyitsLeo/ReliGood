const STEPS = [
  { step: '1', title: 'Browse', desc: 'Find what you love in our catalog.' },
  { step: '2', title: 'WhatsApp Us', desc: 'Tap the button to send your order.' },
  { step: '3', title: 'Receive', desc: 'Get it delivered in ~2 weeks.' },
]

export function HowToBuySteps() {
  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">How to Buy</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {s.step}
            </div>
            <h3 className="mt-2 font-medium text-on-surface">{s.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
