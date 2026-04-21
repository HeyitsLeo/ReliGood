import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="px-4 md:px-6 lg:px-8">
      <div className="min-h-[420px] md:min-h-[480px] lg:min-h-[520px] rounded-xl bg-surface-container-low overflow-hidden flex flex-col md:flex-row">
        {/* Left: text content */}
        <div className="flex flex-col justify-center px-6 py-10 md:w-1/2 md:px-12 md:py-16 lg:px-16 lg:py-20">
          <div className="max-w-[480px]">
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              Reliable Quality
            </span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter text-on-surface">
              Reliable{' '}
              <span className="italic text-primary">Quality</span>,
              <br />
              Affordable{' '}
              <span className="italic text-accent">Good</span>
            </h1>

            <p className="mt-4 text-sm md:text-base text-on-surface-variant leading-relaxed">
              Quality products sourced directly from top manufacturers, delivered to Zambia at fair prices.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/products"
                className="primary-gradient rounded-full px-6 py-3 text-sm font-semibold text-white shadow-ambient transition-opacity hover:opacity-90"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-on-surface/20 px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-on-surface/5"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Right: masked image (desktop only) */}
        <div className="hidden md:block md:w-1/2 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80"
            alt="Premium electronics workspace"
            className="h-full w-full object-cover mask-fade-left"
          />
        </div>
      </div>
    </section>
  )
}
