import { describe, it, expect } from 'vitest'
import { mockEmbed } from '../../../packages/db/src/mock-embed.js'

/**
 * These tests verify the deterministic embedding properties without needing a DB.
 * The real pgvector query path is exercised by the webhook e2e test.
 */
describe('mock embedding', () => {
  it('produces a 1536-dim vector', () => {
    const v = mockEmbed('robot vacuum cleaner')
    expect(v.length).toBe(1536)
  })

  it('is L2-normalized', () => {
    const v = mockEmbed('wireless earbuds bluetooth')
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
    expect(norm).toBeCloseTo(1, 3)
  })

  it('is deterministic — same input → same output', () => {
    const a = mockEmbed('rice cooker kitchen')
    const b = mockEmbed('rice cooker kitchen')
    expect(a).toEqual(b)
  })

  it('token overlap produces higher similarity than unrelated', () => {
    const query = mockEmbed('robot vacuum cleaner white')
    const related = mockEmbed('robot vacuum white round floor')
    const unrelated = mockEmbed('lipstick matte red beauty')

    const cos = (x: number[], y: number[]) => {
      let s = 0
      for (let i = 0; i < x.length; i++) s += x[i]! * y[i]!
      return s
    }

    const simRelated = cos(query, related)
    const simUnrelated = cos(query, unrelated)
    expect(simRelated).toBeGreaterThan(simUnrelated)
  })

  it('handles empty input gracefully', () => {
    const v = mockEmbed('')
    expect(v.length).toBe(1536)
    // still a unit vector
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
    expect(norm).toBeCloseTo(1, 3)
  })
})
