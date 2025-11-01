'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { ChevronUp, ChevronDown } from 'lucide-react'

type DcOrder = {
  _id: string
  dc_code?: string
  school_name: string
  contact_person?: string
  contact_mobile?: string
  products?: any
}

export default function PendingDCPage() {
  const [user, setUser] = useState<{ role?: string } | null>(null)
  const [isManager, setIsManager] = useState(false)
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Check user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('authUser')
        if (raw) {
          const userData = JSON.parse(raw)
          setUser(userData)
          setIsManager(userData.role === 'Manager')
        }
      } catch {}
    }
  }, [])

  const load = async () => {
    if (!isManager) {
      setLoading(true)
      try {
        const data = await apiRequest<DcOrder[]>(`/dc-orders?status=pending`)
        setItems(data)
      } catch (_) {}
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isManager) {
      load()
    }
  }, [isManager])

  // Manager-specific view
  if (isManager) {
    return (
      <div className="space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Viswam Edutech - Pending DC List</h1>
              </div>
              <div className="text-sm text-gray-500">Home &gt; DC &gt; Pending DC List</div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mx-4">
          <h2 className="text-lg font-bold text-gray-900">Pending DC List</h2>
        </div>

        {/* Table Section */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full text-sm min-w-[1400px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      S.No
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      DC No
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      DC Date
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      DC Fin Year
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Executive
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      School Code
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      School Name
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      School Type
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      DC Category
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Products
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      DC Remarks
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Zone
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      SME & FIN
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Action
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={14} className="py-8 px-4 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Pagination Info */}
          <div className="px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">Showing 0 to 0 of 0 entries</div>
          </div>
        </div>
      </div>
    )
  }

  // Default view for non-Manager users
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Pending DC</h1>
      <Card className="p-4 text-neutral-900 overflow-x-auto">
        {loading && 'Loading...'}
        {!loading && items.length === 0 && 'No pending DCs.'}
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
