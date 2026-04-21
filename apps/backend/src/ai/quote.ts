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

export function renderDepositInstruction(params: {
  orderCode: string
  depositZmw: number
  totalZmw: number
}): string {
  const { orderCode, depositZmw, totalZmw } = params
  return [
    `Order *${orderCode}* confirmed! 🎉`,
    ``,
    `💰 *Deposit required:* ZMW ${depositZmw.toFixed(2)}`,
    `📦 *Order total:* ZMW ${totalZmw.toFixed(2)}`,
    ``,
    `*How to pay (Airtel Money):*`,
    `1. Dial *182*1#* on your phone`,
    `2. Select "Send Money"`,
    `3. Send ZMW ${depositZmw.toFixed(2)} to *0977XXXXXX*`,
    `4. Use reference: *${orderCode}*`,
    ``,
    `After sending, take a screenshot of your Airtel confirmation and send it here. We'll verify and start processing your order! 📸`,
  ].join('\n')
}

export function renderPaymentReceivedMessage(orderCode: string): string {
  return `Thank you! 🙏 We received your payment screenshot for *${orderCode}*. Our team will verify it within 30 minutes and start processing your order. We'll keep you updated!`
}
