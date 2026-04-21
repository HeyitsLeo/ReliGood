export function formatPrice(zmw: number | string): string {
  const n = typeof zmw === 'string' ? parseFloat(zmw) : zmw
  return `K ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
