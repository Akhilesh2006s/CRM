'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

type SalesReport = { _id: string; label?: string; value?: number }

export default function ReportsPage() {
  const [reports, setReports] = useState<SalesReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<SalesReport[]>('/reports/sales')
        setReports(data as any)
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Reports</h1>
      <Card className="p-4 text-sm">
        {!loading && reports.length === 0 && 'No reports yet.'}
        {reports.map((r) => (
          <div key={r._id} className="flex justify-between border-b last:border-0 py-2">
            <div className="font-medium text-neutral-900">{r.label || 'Metric'}</div>
            <div className="text-neutral-600">{r.value ?? 0}</div>
          </div>
        ))}
      </Card>
    </div>
  )
}


