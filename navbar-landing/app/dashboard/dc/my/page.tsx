'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type DcOrder = { _id: string; dc_code?: string; school_name: string; contact_person?: string; contact_mobile?: string; zone?: string; status?: string }

export default function MyDCPage() {
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      // backend will infer current user from token by using assigned_to filter client-provided
      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null
      const userId = userRaw ? (JSON.parse(userRaw)?._id as string) : ''
      const data = await apiRequest<DcOrder[]>(`/dc-orders?status=pending&assigned_to=${encodeURIComponent(userId)}`)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const complete = async (id: string, url: string) => {
    if (!url) return alert('Provide proof URL (image/pdf)')
    try {
      await apiRequest(`/dc-orders/${id}/complete`, { method: 'PUT', body: JSON.stringify({ pod_proof_url: url }) })
      load()
    } catch {
      alert('Failed to complete. Ensure you are logged in.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">My Assigned DC</h1>
      <Card className="p-0 overflow-x-auto">
        {loading && <div className="p-4">Loading…</div>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50/70 border-b text-neutral-700">
                <th className="py-2 px-3 text-left">DC Code</th>
                <th className="py-2 px-3 text-left">School</th>
                <th className="py-2 px-3">Mobile</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3 text-left">Proof URL</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="border-b last:border-0">
                  <td className="py-2 px-3">{d.dc_code || '-'}</td>
                  <td className="py-2 px-3">{d.school_name}</td>
                  <td className="py-2 px-3 text-center">{d.contact_mobile || '-'}</td>
                  <td className="py-2 px-3 text-center">{d.zone || '-'}</td>
                  <td className="py-2 px-3"><Input placeholder="https://…" onBlur={(e) => (e.target as any)._pod = e.target.value} /></td>
                  <td className="py-2 px-3 text-right">
                    <Button size="sm" onClick={(e) => {
                      const row = (e.currentTarget.closest('tr') as HTMLTableRowElement)
                      const input = row?.querySelector('input') as HTMLInputElement
                      complete(d._id, input?.value || '')
                    }}>Mark Completed</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}



