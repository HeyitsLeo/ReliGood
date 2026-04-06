'use client'
import { trpc } from '@/lib/trpc'

export default function SettingsPage() {
  const { data, isLoading } = trpc.config.list.useQuery()
  if (isLoading) return <p className="text-slate-500">Loading…</p>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Config</h1>
      <p className="text-sm text-slate-500 mb-4">
        Read-only snapshot of the <code>config</code> table. Edit via DB directly in MVP mode.
      </p>
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-2">Key</th>
            <th className="p-2">Value</th>
            <th className="p-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={row.key} className="border-b border-slate-200">
              <td className="p-2 font-mono">{row.key}</td>
              <td className="p-2 font-mono text-xs">{JSON.stringify(row.value)}</td>
              <td className="p-2 text-slate-500">
                {row.updatedAt
                  ? new Date(row.updatedAt as unknown as string).toLocaleString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
