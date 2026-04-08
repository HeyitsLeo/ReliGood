import { describe, it, expect } from 'vitest'
import { computeSignature, verifySignature, computeTwilioSignature, verifyTwilioSignature } from '../src/lib/signature.js'

describe('signature', () => {
  const secret = 'dev-secret'

  it('verifies its own signature', () => {
    const body = JSON.stringify({ hello: 'world' })
    const sig = computeSignature(body, secret)
    expect(verifySignature(body, sig, secret)).toBe(true)
  })

  it('rejects a wrong signature', () => {
    const body = JSON.stringify({ hello: 'world' })
    expect(verifySignature(body, 'badbadbad', secret)).toBe(false)
  })

  it('rejects missing signature', () => {
    expect(verifySignature('body', undefined, secret)).toBe(false)
  })

  it('accepts sha256= prefix form', () => {
    const body = 'body'
    const sig = computeSignature(body, secret)
    expect(verifySignature(body, `sha256=${sig}`, secret)).toBe(true)
  })

  it('rejects tampered body', () => {
    const sig = computeSignature('original', secret)
    expect(verifySignature('tampered', sig, secret)).toBe(false)
  })
})

describe('twilio signature', () => {
  const authToken = 'test-twilio-token'
  const url = 'https://example.com/api/twilio/webhook'

  it('verifies its own signature', () => {
    const params = { Body: 'hello', From: 'whatsapp:+260971234567', WaId: '260971234567' }
    const sig = computeTwilioSignature(url, params, authToken)
    expect(verifyTwilioSignature(url, params, sig, authToken)).toBe(true)
  })

  it('rejects wrong signature', () => {
    const params = { Body: 'hello' }
    expect(verifyTwilioSignature(url, params, 'badsignature', authToken)).toBe(false)
  })

  it('rejects missing signature', () => {
    const params = { Body: 'hello' }
    expect(verifyTwilioSignature(url, params, undefined, authToken)).toBe(false)
  })

  it('sorts params alphabetically for signing', () => {
    const params = { Z: '1', A: '2', M: '3' }
    const sig = computeTwilioSignature(url, params, authToken)
    // Verify it matches by checking round-trip
    expect(verifyTwilioSignature(url, params, sig, authToken)).toBe(true)
  })

  it('rejects tampered params', () => {
    const params = { Body: 'original' }
    const sig = computeTwilioSignature(url, params, authToken)
    expect(verifyTwilioSignature(url, { Body: 'tampered' }, sig, authToken)).toBe(false)
  })
})
