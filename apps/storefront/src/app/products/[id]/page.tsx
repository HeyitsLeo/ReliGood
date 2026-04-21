'use client'
import { use } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { ImageGallery } from '@/components/ImageGallery'
import { PriceTag } from '@/components/PriceTag'
import { CategoryBadge } from '@/components/CategoryBadge'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { ProductHighlights } from '@/components/ProductHighlights'
import { ProductSpecs } from '@/components/ProductSpecs'
import { HowToBuySteps } from '@/components/HowToBuySteps'
import { ProductStory } from '@/components/ProductStory'
import { ReviewsSection } from '@/components/ReviewsSection'
import { ProductFAQ } from '@/components/ProductFAQ'
import { SimilarProducts } from '@/components/SimilarProducts'
import { formatPrice } from '@/lib/format'
import { deriveSubtitle } from '@/lib/product-utils'
import { DELIVERY_INFO, DEPOSIT_PERCENT, PAYMENT_METHODS } from '@/lib/constants'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: product, isLoading } = trpc.storefront.productById.useQuery({ id })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 h-4 w-48 animate-pulse rounded bg-surface-container" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-surface-container" />
          <div className="space-y-4">
            <div className="h-5 w-24 animate-pulse rounded bg-surface-container" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-surface-container" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-surface-container" />
            <div className="h-10 w-32 animate-pulse rounded bg-surface-container" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-surface-container" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container" />
            </div>
            <div className="h-12 w-48 animate-pulse rounded-full bg-surface-container" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Product Not Found</h1>
        <p className="mt-2 text-on-surface-variant">This product may no longer be available.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-white hover:bg-primary-container"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  const price = Number(product.priceZmw ?? 0)
  const deposit = Math.ceil(price * (DEPOSIT_PERCENT / 100))
  const subtitle = deriveSubtitle(product.tags, product.title)
  const waMessage = `Hi ReliGood! I'd like to order: ${product.title} (${formatPrice(price)})`

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 md:pb-8">
      {/* 1. Breadcrumb */}
      <nav className="mb-4 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-on-surface">{product.title}</span>
      </nav>

      {/* Above the fold: 2-col on desktop */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* 2. Image Gallery */}
        <ImageGallery images={product.imageUrls} alt={product.title} />

        {/* Right column: info */}
        <div>
          <CategoryBadge category={product.category} />

          {/* 3. Title + Subtitle */}
          <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
            {product.title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          )}

          {/* 4. Price + Deposit */}
          <PriceTag price={price} className="mt-3 text-3xl" />
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {DEPOSIT_PERCENT}% deposit ({formatPrice(deposit)})
            </span>
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              Balance on delivery
            </span>
          </div>

          {/* 5. Key Highlights */}
          <div className="mt-5">
            <ProductHighlights
              description={product.description}
              tags={product.tags}
              category={product.category}
            />
          </div>

          {/* 6. Desktop CTA */}
          <div className="mt-6 hidden md:block">
            <WhatsAppButton message={waMessage} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <span key={m} className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Below the fold ───── */}
      <div className="mt-12 space-y-12">
        {/* 7. Specs Table */}
        <ProductSpecs category={product.category} tags={product.tags} />

        {/* 8. How to Buy */}
        <HowToBuySteps />

        {/* 9. A+ Story Cards */}
        <ProductStory category={product.category} />

        {/* 10. Reviews Placeholder */}
        <ReviewsSection />

        {/* 11. FAQ Accordion */}
        <ProductFAQ category={product.category} />

        {/* 12. Similar Products */}
        <SimilarProducts category={product.category} excludeId={product.id} />

        {/* 13. Final CTA block */}
        <section className="rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface">Ready to Order?</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Send us a message on WhatsApp and we&apos;ll get your order started.
          </p>
          <div className="mt-4">
            <WhatsAppButton message={waMessage} />
          </div>
        </section>
      </div>

      {/* Mobile fixed WhatsApp CTA */}
      <div className="fixed bottom-14 left-0 right-0 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] bg-surface-container-lowest px-4 py-2 safe-bottom md:hidden">
        <WhatsAppButton message={waMessage} className="w-full justify-center" />
      </div>
    </div>
  )
}
