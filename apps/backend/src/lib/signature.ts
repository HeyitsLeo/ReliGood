import { createHmac, timingSafeEqual } from 'node:crypto'

/** HMAC-SHA256 over a raw body with a secret, returns hex digest. */
export function computeSignature(rawBody: string | Buffer, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(typeof rawBody === 'string' ? rawBody : rawBody)
  return hmac.digest('hex')
}

/** Constant-time comparison. Returns false on any length mismatch / invalid hex. */
export function verifySignature(
  rawBody: string | Buffer,
  provided: string | undefined,
  secret: string,
): boolean {
  if (!provided) return false
  const expected = computeSignature(rawBody, secret)
  // Allow 'sha256=xxx' prefixed form
  const normalized = provided.startsWith('sha256=') ? provided.slice(7) : provided
  if (normalized.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(normalized, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
