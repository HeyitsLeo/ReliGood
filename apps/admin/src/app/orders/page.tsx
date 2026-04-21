'use client'
import { trpc } from '@/lib/trpc'

/** Valid next statuses for each order status (matches ORDER_TRANSITIONS in shared) */
const NEXT_STATUSES: Record<string, string[]> = {
  draft: ['paid_deposit', 'cancelled'],
  paid_deposit: ['ordered_from_taobao', 'cancelled'],
  ordered_from_taobao: ['in_transit_cn'],
  in_transit_cn: ['arrived_cn_wh'],
  arrived_cn_wh: ['in_transit_air'],
  in_transit_air: ['arrived_zm_wh'],
  arrived_zm_wh: ['ready_pickup'],
  ready_pickup: ['picked_up', 'no_show_forfeit'],
  picked_up: ['completed'],
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  paid_deposit: 'bg-green-100 text-green-800',
  ordered_from_taobao: 'bg-blue-100 text-blue-800',
  in_transit_cn: 'bg-blue-100 text-blue-800',
  arrived_cn_wh: 'bg-blue-100 text-blue-800',
  in_transit_air: 'bg-indigo-100 text-indigo-800',
  arrived_zm_wh: 'bg-purple-100 text-purple-800',
  ready_pickup: 'bg-yellow-100 text-yellow-800',
  picked_up: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
}

export default function OrdersPage() {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.orders.list.useQuery(undefined)
  const transitionMut = trpc.orders.transition.useMutation({
    onSuccess: () => utils.orders.list.invalidate(),
  })

  if (isLoading) return <p className="text-slate-500">Loading...</p>
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
            <th className="p-2">Customer</th>
            <th className="p-2">Total</th>
            <th className="p-2">Deposit</th>
            <th className="p-2">Status</th>
            <th className="p-2">Payment</th>
            <th className="p-2">Actions</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {data.map((o: any) => {
            const nextStatuses = NEXT_STATUSES[o.status] ?? []
            const colorClass = STATUS_COLORS[o.status] ?? 'bg-slate-100 text-slate-700'
            return (
              <tr key={o.id} className="border-b border-slate-200">
                <td className="p-2 font-mono">{o.orderCode}</td>
                <td className="p-2 text-xs">{o.waName || o.waPhone || '-'}</td>
                <td className="p-2">ZMW {Number(o.totalZmw).toFixed(2)}</td>
                <td className="p-2">ZMW {Number(o.depositZmw).toFixed(2)}</td>
                <td className="p-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${colorClass}`}>
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-2 text-xs text-slate-500">
                  {o.depositAirtelRef ? (
                    o.depositAirtelRef.startsWith('screenshot:') ? (
                      <span className="text-amber-600">Screenshot pending</span>
                    ) : (
                      <span className="text-green-600">Ref: {o.depositAirtelRef}</span>
                    )
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {nextStatuses.map((next) => (
                      <button
                        key={next}
                        className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={transitionMut.isPending}
                        onClick={() =>
                          transitionMut.mutate({ orderId: o.id, nextStatus: next as any })
                        }
                      >
                        {next.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="p-2 text-xs text-slate-500">
                  {new Date(o.createdAt as unknown as string).toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
