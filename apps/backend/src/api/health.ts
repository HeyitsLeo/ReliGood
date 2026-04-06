import type { FastifyInstance } from 'fastify'
import { getSql } from '@zamgo/db'
import { Redis } from 'ioredis'
import { env } from '../config.js'

let _pingRedis: Redis | null = null

export async function registerHealth(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    const result: Record<string, unknown> = { ok: true, mode: env.ADAPTER_MODE }
    // DB ping
    try {
      await getSql()`SELECT 1`
      result.db = 'ok'
    } catch (e) {
      result.db = `error: ${(e as Error).message}`
      result.ok = false
    }
    // Redis ping
    try {
      if (!_pingRedis) {
        _pingRedis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true })
        await _pingRedis.connect()
      }
      const pong = await _pingRedis.ping()
      result.redis = pong === 'PONG' ? 'ok' : pong
    } catch (e) {
      result.redis = `error: ${(e as Error).message}`
      result.ok = false
    }
    return reply.code(result.ok ? 200 : 503).send(result)
  })
}
