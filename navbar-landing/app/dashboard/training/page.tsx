'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

type Training = { _id: string; title?: string; status?: string; date?: string }

export default function TrainingPage() {
  const [items, setItems] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<Training[]>('/training')
        setItems(data as any)
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Trainings & Services</h1>
      <Card className="p-4 text-sm">
        {!loading && items.length === 0 && 'No trainings yet.'}
        {items.slice(0, 30).map((t) => (
          <div key={t._id} className="flex items-center justify-between border-b last:border-0 py-2">
            <div className="font-medium text-neutral-900">{t.title || 'Training'}</div>
            <div className="text-neutral-500">{t.status || '-'}</div>
            <div className="text-neutral-500">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}


