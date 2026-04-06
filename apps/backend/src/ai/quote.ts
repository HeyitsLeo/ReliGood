import type { QuoteBreakdown } from '@zamgo/shared'

/**
 * Render a short WhatsApp-friendly quote message.
 * Plain template; swap with LLM call for variety in real mode.
 */
export function renderQuoteMessage(params: {
  productTitle: string
  breakdown: QuoteBreakdown
  etaDays: number
}): string {
  const { productTitle, breakdown, etaDays } = params
  return [
    `Got it 👍 Here's your quote for ${productTitle}:`,
    ``,
    `Total: ZMW ${breakdown.final_price_zmw.toFixed(2)}`,
    `Deposit (30%): ZMW ${breakdown.deposit_zmw.toFixed(2)}`,
    `Balance on pickup: ZMW ${breakdown.balance_zmw.toFixed(2)}`,
    `ETA: ${etaDays} days to Lusaka pickup`,
    ``,
    `Reply YES to confirm and we'll send the Airtel Money payment link.`,
  ].join('\n')
}

export function renderMatchConfirmMessage(params: {
  productTitle: string
  similarity: number
}): string {
  const pct = Math.round(params.similarity * 100)
  return `We have something similar (${pct}% match): "${params.productTitle}". Is this what you're looking for? Reply YES or send a clearer picture.`
}

export function renderNotFoundMessage(): string {
  return `We don't have it in stock but we can source it from China (usually 14 days). Can you send a picture or product link? 🔍`
}
