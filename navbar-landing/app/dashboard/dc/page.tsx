'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

type DC = { _id: string; status?: string; reference?: string }

export default function DCPage() {
  const [items, setItems] = useState<DC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<DC[]>('/dc')
        setItems(data as any)
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Delivery Challans</h1>
      <Card className="p-4 text-sm">
        {!loading && items.length === 0 && 'No DCs yet.'}
        {items.slice(0, 30).map((d) => (
          <div key={d._id} className="flex justify-between border-b last:border-0 py-2">
            <div className="font-medium text-neutral-900">{d.reference || d._id}</div>
            <div className="text-neutral-600">{d.status || '-'}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}


