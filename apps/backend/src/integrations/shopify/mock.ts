import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(__dirname, '..', '..', '..', '..', '..', 'fixtures', 'shopify-products.json')

export async function listProducts() {
  const raw = await readFile(FIXTURE, 'utf8')
  return JSON.parse(raw) as Array<{
    shopify_product_id: string
    title: string
    category: string
    price_zmw: number
    image_urls: string[]
    in_stock: boolean
  }>
}

export async function createDraftOrder(params: {
  customerPhone: string
  totalZmw: number
  depositZmw: number
  title: string
}) {
  return {
    id: `gid://shopify/DraftOrder/mock-${Date.now()}`,
    invoice_url: `https://zamgo.myshopify.com/mock-pay/${params.customerPhone}?amount=${params.depositZmw}`,
    status: 'open' as const,
  }
}
