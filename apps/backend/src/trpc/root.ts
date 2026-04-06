import { router } from './context.js'
import { dashboardRouter } from './routers/dashboard.js'
import { requestsRouter } from './routers/requests.js'
import { ordersRouter } from './routers/orders.js'
import { configRouter } from './routers/config.js'
import { messagesRouter } from './routers/messages.js'

export const appRouter = router({
  dashboard: dashboardRouter,
  requests: requestsRouter,
  orders: ordersRouter,
  config: configRouter,
  messages: messagesRouter,
})

export type AppRouter = typeof appRouter
