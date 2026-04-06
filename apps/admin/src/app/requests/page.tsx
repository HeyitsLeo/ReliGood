'use client'
import { trpc } from '@/lib/trpc'

const COLUMNS = [
  { key: 'new', label: 'New', color: 'bg-slate-100' },
  { key: 'matching', label: 'Matching', color: 'bg-blue-100' },
  { key: 'quoted', label: 'Quoted', color: 'bg-purple-100' },
  { key: 'paid', label: 'Paid', color: 'bg-green-100' },
  { key: 'fulfilled', label: 'Fulfilled', color: 'bg-slate-200' },
] as const

export default function RequestsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Requests</h1>
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.key} status={col.key} label={col.label} color={col.color} />
        ))}
      </div>
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  color,
}: {
  status: 'new' | 'matching' | 'quoted' | 'paid' | 'fulfilled'
  label: string
  color: string
}) {
  const { data } = trpc.requests.listByStatus.useQuery({ status })
  const items = data ?? []
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
        <span className="text-xs text-slate-500">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-sm"
          >
            <div className="font-medium text-slate-900 mb-1">{r.waName || r.waPhone}</div>
            <div className="text-slate-700 line-clamp-2">{r.rawText}</div>
            {r.aiKeywords && (
              <div className="mt-1 text-[10px] text-purple-600 italic">{r.aiKeywords}</div>
            )}
            <div className="mt-1 text-[10px] text-slate-400">
              {new Date(r.createdAt as unknown as string).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
