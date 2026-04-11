/**
 * ReliGood Zambia Group welcome message.
 * Sent automatically on a customer's first inbound message.
 */

export interface WelcomeParams {
  /** Customer WhatsApp phone, e.g. "+260773000154" */
  phone: string
  /** Sequential member number, e.g. 6 */
  memberNumber: number
}

export function renderWelcomeMessage({ phone, memberNumber }: WelcomeParams): string {
  return [
    `🎉 Welcome @${phone}!`,
    ``,
    `You are member #${memberNumber} of ReliGood Zambia Group!`,
    ``,
    `✅ Exclusive discount for you:`,
    `💰 K100 OFF your purchase!`,
    ``,
    `📋 How to use your discount:`,
    `• Minimum purchase: K400`,
    `• Screenshot this message (showing you are member #${memberNumber})`,
    `• Show the screenshot when you buy — discount applied instantly!`,
    ``,
    `📱 What is ReliGood?`,
    `We specialize in pre-owned iPhones — tested, verified & ready to use. We also source other items on request!`,
    ``,
    `🛒 How to order:`,
    `• Tell us what you want in the group`,
    `• We give you a price quote`,
    `• Pay 30% deposit to confirm your order`,
    `• We ship from China — delivered to Lusaka in ~2 weeks! 🇿🇲`,
  ].join('\n')
}
