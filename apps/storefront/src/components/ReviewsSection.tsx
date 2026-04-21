import { WhatsAppButton } from './WhatsAppButton'

export function ReviewsSection() {
  return (
    <section>
      <h2 className="text-lg font-semibold font-display text-on-surface">Customer Reviews</h2>
      <div className="mt-4 rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm">
        <p className="text-on-surface-variant">Be the first to share your experience</p>
        <div className="mt-4">
          <WhatsAppButton
            message="Hi ReliGood! I'd like to share my review for a product I ordered."
            label="Send Us Your Review"
            size="default"
          />
        </div>
      </div>
    </section>
  )
}
