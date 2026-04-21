import { router } from './context.js'
import { dashboardRouter } from './routers/dashboard.js'
import { requestsRouter } from './routers/requests.js'
import { ordersRouter } from './routers/orders.js'
import { configRouter } from './routers/config.js'
import { messagesRouter } from './routers/messages.js'
import { storefrontRouter } from './routers/storefront.js'
import { productsRouter } from './routers/products.js'

export const appRouter = router({
  dashboard: dashboardRouter,
  requests: requestsRouter,
  orders: ordersRouter,
  config: configRouter,
  messages: messagesRouter,
  storefront: storefrontRouter,
  products: productsRouter,
})

export type AppRouter = typeof appRouter
