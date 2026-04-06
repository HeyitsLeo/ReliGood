import type { FastifyInstance } from 'fastify'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../trpc/root.js'
import { createContext } from '../trpc/context.js'
import { logger } from '../logger.js'

export async function registerTrpc(app: FastifyInstance) {
  app.all('/trpc/*', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const fetchReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : JSON.stringify(req.body ?? {}),
    })
    const resp = await fetchRequestHandler({
      endpoint: '/trpc',
      req: fetchReq,
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        logger.error({ err: error.message, path }, 'trpc error')
      },
    })
    reply.status(resp.status)
    resp.headers.forEach((v, k) => reply.header(k, v))
    const text = await resp.text()
    return reply.send(text)
  })
}
