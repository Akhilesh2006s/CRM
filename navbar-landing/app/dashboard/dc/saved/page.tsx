'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type DcOrder = {
  _id: string
  school_name: string
  contact_person?: string
  contact_mobile?: string
  zone?: string
}

export default function SavedDCPage() {
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  // Get current user to check role
  const currentUser = getCurrentUser()
  const isManager = currentUser?.role === 'Manager'

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<DcOrder[]>(`/dc-orders?status=saved`)
      setItems(data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const reopen = async (id: string) => {
    try {
      await apiRequest(`/dc-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'pending' }) })
      load()
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Saved DC (On Hold)</h1>
      <Card className="p-4 text-neutral-900">
        {loading && 'Loading...'}
        {!loading && items.length === 0 && 'No saved deals.'}
        <div className="divide-y">
          {items.map((d) => (
            <div key={d._id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-medium text-neutral-900">{d.school_name}</div>
                <div className="text-neutral-600 text-sm">{d.contact_person || '-'} · {d.contact_mobile || '-'}</div>
              </div>
              {!isManager && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => reopen(d._id)}>Reopen</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

