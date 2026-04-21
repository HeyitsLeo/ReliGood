'use client'
import { trpc } from '@/lib/trpc'
import { useState, useMemo } from 'react'

export default function InboxPage() {
  const { data, isLoading } = trpc.messages.listRecent.useQuery({ limit: 200 })
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  // Group messages by customer
  const customers = useMemo(() => {
    if (!data) return []
    const map = new Map<
      string,
      { customerId: string; waName: string | null; waPhone: string | null; lastMessage: string; lastAt: string }
    >()
    for (const m of data) {
      if (!m.customerId) continue
      if (!map.has(m.customerId)) {
        map.set(m.customerId, {
          customerId: m.customerId,
          waName: m.waName,
          waPhone: m.waPhone,
          lastMessage: m.content ?? '',
          lastAt: m.createdAt as unknown as string,
        })
      }
    }
    return Array.from(map.values())
  }, [data])

  if (isLoading) return <p className="text-slate-500">Loading...</p>
  if (!data || data.length === 0)
    return <p className="text-slate-500">No messages yet. Try <code>pnpm sim --batch</code></p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: '70vh' }}>
        {/* Customer list */}
        <div className="col-span-1 space-y-1 overflow-y-auto border-r border-slate-200 pr-3">
          {customers.map((c) => (
            <button
              key={c.customerId}
              onClick={() => setSelectedCustomer(c.customerId)}
              className={`w-full text-left rounded-md p-2 text-xs hover:bg-slate-100 ${
                selectedCustomer === c.customerId ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-100'
              }`}
            >
              <div className="font-medium text-slate-900">{c.waName || c.waPhone || 'Unknown'}</div>
              <div className="text-slate-500 truncate">{c.lastMessage}</div>
            </button>
          ))}
        </div>

        {/* Conversation view */}
        <div className="col-span-2 flex flex-col">
          {selectedCustomer ? (
            <ConversationView customerId={selectedCustomer} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Select a customer to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationView({ customerId }: { customerId: string }) {
  const utils = trpc.useUtils()
  const { data: msgs } = trpc.messages.listByCustomer.useQuery({ customerId, limit: 100 })
  const [replyText, setReplyText] = useState('')

  const sendMut = trpc.messages.sendToCustomer.useMutation({
    onSuccess: () => {
      setReplyText('')
      utils.messages.listByCustomer.invalidate({ customerId })
      utils.messages.listRecent.invalidate()
    },
  })

  const sorted = useMemo(() => {
    if (!msgs) return []
    return [...msgs].sort(
      (a, b) => new Date(a.createdAt as unknown as string).getTime() - new Date(b.createdAt as unknown as string).getTime(),
    )
  }, [msgs])

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {sorted.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.direction === 'inbound'
                  ? 'bg-white border border-slate-200 text-slate-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <div className="break-words whitespace-pre-wrap">{m.content}</div>
              <div
                className={`text-[10px] mt-1 ${
                  m.direction === 'inbound' ? 'text-slate-400' : 'text-blue-200'
                }`}
              >
                {new Date(m.createdAt as unknown as string).toLocaleTimeString()}
                {m.agent && ` · ${m.agent}`}
                {m.isAi && ' · AI'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
              e.preventDefault()
              sendMut.mutate({ customerId, text: replyText.trim() })
            }
          }}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
          disabled={sendMut.isPending || !replyText.trim()}
          onClick={() => {
            if (replyText.trim()) {
              sendMut.mutate({ customerId, text: replyText.trim() })
            }
          }}
        >
          {sendMut.isPending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
