import { router, publicProcedure } from '../context.js'
import { getSql } from '@zamgo/db'

export const dashboardRouter = router({
  getToday: publicProcedure.query(async () => {
    const sql = getSql()
    const [inquiries] = await sql<[{ count: string }]>`
      SELECT COUNT(*)::text AS count FROM product_requests
      WHERE created_at >= date_trunc('day', NOW())
    `
    const [orders] = await sql<[{ count: string }]>`
      SELECT COUNT(*)::text AS count FROM orders
      WHERE created_at >= date_trunc('day', NOW())
    `
    const [gmv] = await sql<[{ total: string | null }]>`
      SELECT COALESCE(SUM(total_zmw), 0)::text AS total FROM orders
      WHERE created_at >= date_trunc('day', NOW())
    `
    const [conv] = await sql<[{ count: string }]>`
      SELECT COUNT(*)::text AS count FROM product_requests
      WHERE status IN ('quoted','accepted') AND created_at >= date_trunc('day', NOW())
    `
    const inquiriesN = Number(inquiries?.count ?? 0)
    const convertedN = Number(conv?.count ?? 0)
    return {
      inquiries: inquiriesN,
      orders: Number(orders?.count ?? 0),
      gmv_zmw: Number(gmv?.total ?? 0),
      conversion: inquiriesN > 0 ? convertedN / inquiriesN : 0,
    }
  }),
})
