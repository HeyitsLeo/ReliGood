'use client'
import { trpc } from '@/lib/trpc'

export default function InboxPage() {
  const { data, isLoading } = trpc.messages.listRecent.useQuery({ limit: 50 })
  if (isLoading) return <p className="text-slate-500">Loading…</p>
  if (!data || data.length === 0)
    return <p className="text-slate-500">No messages yet. Try <code>pnpm sim --batch</code></p>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <div className="space-y-2">
        {data.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3"
          >
            <div
              className={`mt-1 h-2 w-2 rounded-full ${
                m.direction === 'inbound' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-900">
                  {m.waName || m.waPhone || 'Unknown'}
                </span>
                <span>·</span>
                <span>{m.direction}</span>
                {m.agent && (
                  <>
                    <span>·</span>
                    <span className="text-purple-600">{m.agent}</span>
                  </>
                )}
                <span className="ml-auto">
                  {new Date(m.createdAt as unknown as string).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-800 break-words">{m.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
