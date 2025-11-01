'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronUp, ChevronDown } from 'lucide-react'

type DcOrder = {
  _id: string
  dc_code?: string
  school_name: string
  contact_person?: string
  contact_mobile?: string
  products?: any
}

// Sample data matching the image
const sampleData = [
  {
    dcNo: '20-21/275',
    dcDate: '2020-03-12',
    leadFinYear: '2019-20',
    schoolType: 'Existing',
    zone: 'Hyderabad',
    town: '',
    schoolName: 'columbus high school',
    executive: 'Dharaz Khan MD',
    mobile: '9030474447',
    schoolCode: '',
    po: 'placeholder',
    action: '',
    remarks: 'madam to b talk chairman sir',
  },
  {
    dcNo: '20-21/274',
    dcDate: '2020-03-12',
    leadFinYear: '2020-21',
    schoolType: 'New',
    zone: 'Secunderabad',
    town: 'hyd',
    schoolName: 'spring valley school',
    executive: 'VENKAT',
    mobile: '8886474446',
    schoolCode: 'HYKUK4021',
    po: 'placeholder',
    action: '',
    remarks: 'interested',
  },
]

export default function SavedDCPage() {
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
        const data = await apiRequest<DcOrder[]>(`/dc-orders?status=saved`)
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
                <h1 className="text-xl font-semibold text-gray-900">Viswam Edutech - Saved DC List</h1>
              </div>
              <div className="text-sm text-gray-500">Home &gt; DC &gt; Saved DC List</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-100 mx-4 rounded-lg px-4 py-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Saved DC</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
            <Input 
              placeholder="By School Name" 
              className="bg-white border-gray-300"
            />
            <Input 
              placeholder="By School Code" 
              className="bg-white border-gray-300"
            />
            <Input 
              placeholder="By Contact Mobile No" 
              className="bg-white border-gray-300"
            />
            <Input 
              placeholder="dd-mm-yyyy" 
              type="text"
              className="bg-white border-gray-300"
            />
            <Input 
              placeholder="dd-mm-yyyy" 
              type="text"
              className="bg-white border-gray-300"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Select Executive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dharaz">Dharaz Khan MD</SelectItem>
                <SelectItem value="venkat">VENKAT</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-gray-50 border-b">
                <tr>
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
                      Lead Fin Year
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
                      Zone
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Town
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
                      Executive
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Mobile
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
                      PO
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
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Remarks
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.dcNo}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.dcDate}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.leadFinYear}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.schoolType}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.zone}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.town || '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{row.schoolName}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.executive}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.mobile}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.schoolCode || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">PO</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.action || '-'}</td>
                    <td className="py-3 px-4 text-gray-900">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Default view for non-Manager users
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Saved DC</h1>
      <Card className="p-4 text-neutral-900 overflow-x-auto">
        {loading && 'Loading...'}
        {!loading && items.length === 0 && 'No saved DCs.'}
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
