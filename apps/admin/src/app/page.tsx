'use client'
import { trpc } from '@/lib/trpc'

export default function DashboardPage() {
  const { data, isLoading } = trpc.dashboard.getToday.useQuery()
  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!data) return <p className="text-slate-500">No data yet.</p>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Today</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Inquiries" value={String(data.inquiries)} />
        <Stat label="Orders" value={String(data.orders)} />
        <Stat label="GMV (ZMW)" value={data.gmv_zmw.toFixed(2)} />
        <Stat label="Conversion" value={`${(data.conversion * 100).toFixed(0)}%`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
