'use client'
import { trpc } from '@/lib/trpc'

export default function OrdersPage() {
  const { data, isLoading } = trpc.orders.list.useQuery(undefined)
  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!data || data.length === 0)
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <p className="text-slate-500">No orders yet. Orders are created when customers accept a quote.</p>
      </div>
    )
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-2">Code</th>
            <th className="p-2">Total</th>
            <th className="p-2">Deposit</th>
            <th className="p-2">Status</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} className="border-b border-slate-200">
              <td className="p-2 font-mono">{o.orderCode}</td>
              <td className="p-2">ZMW {Number(o.totalZmw).toFixed(2)}</td>
              <td className="p-2">ZMW {Number(o.depositZmw).toFixed(2)}</td>
              <td className="p-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{o.status}</span>
              </td>
              <td className="p-2 text-slate-500">
                {new Date(o.createdAt as unknown as string).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
