import { describe, it, expect } from 'vitest'
import { classifyIntentRule } from '../src/ai/router.js'

describe('classifyIntentRule', () => {
  const cases: Array<[string, string]> = [
    // product_inquiry
    ['how much for a robot vacuum cleaner?', 'product_inquiry'],
    ['price for air fryer', 'product_inquiry'],
    ['do you have wireless earbuds', 'product_inquiry'],
    ['i want to buy rice cooker', 'product_inquiry'],
    ['looking for face lotion', 'product_inquiry'],
    ['cost of iphone case', 'product_inquiry'],
    ['got any cheap headphones', 'product_inquiry'],

    // order_status
    ['where is my order ORD-7731?', 'order_status'],
    ['when will my parcel arrive?', 'order_status'],
    ['status of ORD-1234', 'order_status'],
    ['track my order please', 'order_status'],

    // payment_help
    ['how do i pay with airtel money', 'payment_help'],
    ['i want to send deposit via mtn', 'payment_help'],
    ['how to pay for my order', 'payment_help'],
    ['already paid, confirmation?', 'payment_help'],

    // complaint
    ['the item is broken, i want refund!', 'complaint'],
    ['this is a scam, you cheated me', 'complaint'],
    ['wrong item received, angry', 'complaint'],
    ['damaged product, return please', 'complaint'],

    // greeting
    ['hi', 'greeting'],
    ['hello there', 'greeting'],
    ['good morning!', 'greeting'],
    ['muli bwanji', 'greeting'],

    // faq
    ['how many days until delivery', 'faq'],
    ['where is your warehouse', 'faq'],
    ['what are your opening hours', 'faq'],
    ['do you ship from china?', 'faq'],
  ]

  for (const [text, expected] of cases) {
    it(`classifies "${text}" as ${expected}`, () => {
      const result = classifyIntentRule(text)
      expect(result).not.toBeNull()
      expect(result!.intent).toBe(expected)
      expect(result!.confidence).toBeGreaterThan(0.85)
    })
  }

  it('returns null for gibberish', () => {
    const result = classifyIntentRule('xyz qwerty plumbus')
    expect(result).toBeNull()
  })
})
