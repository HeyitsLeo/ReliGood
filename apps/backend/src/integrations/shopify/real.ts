export async function listProducts() {
  throw new Error('Shopify real adapter not implemented')
}

export async function createDraftOrder(_params: {
  customerPhone: string
  totalZmw: number
  depositZmw: number
  title: string
}) {
  throw new Error('Shopify real draft order not implemented')
}
