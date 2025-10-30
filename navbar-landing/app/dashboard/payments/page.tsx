'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

type Payment = { _id: string; amount?: number; method?: string; status?: string; date?: string }

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<Payment[]>('/payments')
        setItems(data as any)
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Payments</h1>
      <Card className="p-4 text-sm">
        {!loading && items.length === 0 && 'No payments yet.'}
        {items.slice(0, 30).map((p) => (
          <div key={p._id} className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b last:border-0 py-2">
            <div className="font-medium text-neutral-900">₹{p.amount ?? 0}</div>
            <div className="text-neutral-600">{p.method || '-'}</div>
            <div className="text-neutral-600">{p.status || '-'}</div>
            <div className="text-neutral-500">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}


