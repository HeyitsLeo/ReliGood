import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { orders, customers } from '@zamgo/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ORDER_STATUSES } from '@zamgo/shared'
import { transitionOrder, getOrderById } from '../../domain/order-repo.js'
import { sendText } from '../../integrations/whatsapp/index.js'
import { getCustomerById } from '../../domain/customer.js'
import { insertMessage } from '../../domain/messages.js'

/** Human-friendly status labels sent via WhatsApp */
const STATUS_NOTIFICATIONS: Partial<Record<string, string>> = {
  paid_deposit: 'Your deposit has been confirmed! We are now ordering your item from our supplier. 🎉',
  ordered_from_taobao: 'Great news — your item has been ordered from our supplier in China! 📦',
  in_transit_cn: 'Your item is on its way to our China warehouse. 🚚',
  arrived_cn_wh: 'Your item arrived at our China warehouse and will be shipped to Zambia soon! 🏭',
  in_transit_air: 'Your item is on a flight to Zambia! ✈️',
  arrived_zm_wh: 'Your item has arrived in Lusaka! We are preparing it for pickup. 🇿🇲',
  ready_pickup: 'Your order is ready for pickup! Please visit our location to collect it. 📍',
  completed: 'Order completed. Thank you for shopping with ReliGood! 🙏',
  cancelled: 'Your order has been cancelled. If you have questions, please reach out.',
  refunded: 'Your refund has been processed. Please allow 1-3 business days for the funds to arrive.',
}

export const ordersRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.enum(ORDER_STATUSES).optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb()
      const status = input?.status
      if (status) {
        return db
          .select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt))
          .limit(100)
      }
      return db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          customerId: orders.customerId,
          totalZmw: orders.totalZmw,
          depositZmw: orders.depositZmw,
          balanceZmw: orders.balanceZmw,
          status: orders.status,
          depositPaidAt: orders.depositPaidAt,
          depositAirtelRef: orders.depositAirtelRef,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          waName: customers.waName,
          waPhone: customers.waPhone,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .orderBy(desc(orders.createdAt))
        .limit(100)
    }),

  // ── G8: Transition order status + auto-notify customer ──
  transition: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        nextStatus: z.enum(ORDER_STATUSES),
      }),
    )
    .mutation(async ({ input }) => {
      await transitionOrder(input.orderId, input.nextStatus)

      // Auto-notify customer via WhatsApp
      const notification = STATUS_NOTIFICATIONS[input.nextStatus]
      if (notification) {
        const order = await getOrderById(input.orderId)
        if (order?.customerId) {
          const customer = await getCustomerById(order.customerId)
          if (customer) {
            const text = `[${order.orderCode}] ${notification}`
            try {
              await sendText(customer.waPhone, text)
              await insertMessage({
                customerId: order.customerId,
                direction: 'outbound',
                type: 'text',
                content: text,
                agent: 'order',
                isAi: false,
              })
            } catch {
              // best-effort notification
            }
          }
        }
      }

      return { ok: true }
    }),
})
