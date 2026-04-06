import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

export interface TrpcContext {
  // add auth context here later
}

export const createContext = async (): Promise<TrpcContext> => ({})

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson })

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
