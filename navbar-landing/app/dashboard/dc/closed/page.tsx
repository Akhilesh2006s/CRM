'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'

type DcOrder = {
  _id: string
  dc_code?: string
  school_name: string
  contact_person?: string
  contact_mobile?: string
  products?: any
}

export default function ClosedSalesPage() {
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<DcOrder[]>(`/dc-orders?status=completed`)
      setItems(data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Closed Sales</h1>
      <Card className="p-4 text-neutral-900 overflow-x-auto">
        {loading && 'Loading...'}
        {!loading && items.length === 0 && 'No closed deals.'}
        {!loading && items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50/70 border-b text-neutral-700">
                <th className="py-2 px-3 text-left">DC Code</th>
                <th className="py-2 px-3 text-left">School</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3">Mobile</th>
                <th className="py-2 px-3 text-left">Products</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="border-b last:border-0">
                  <td className="py-2 px-3">{d.dc_code || '-'}</td>
                  <td className="py-2 px-3">{d.school_name}</td>
                  <td className="py-2 px-3 text-center">{d.contact_person || '-'}</td>
                  <td className="py-2 px-3 text-center">{d.contact_mobile || '-'}</td>
                  <td className="py-2 px-3 truncate max-w-[320px]">{Array.isArray(d.products) ? d.products.map(p=>p.product_name).join(', ') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

