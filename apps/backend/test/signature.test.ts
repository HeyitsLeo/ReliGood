import { describe, it, expect } from 'vitest'
import { computeSignature, verifySignature } from '../src/lib/signature.js'

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
