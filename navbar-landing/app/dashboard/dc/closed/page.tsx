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
    createdOn: '30-Oct-2025 01:26:29 PM',
    schoolType: 'New',
    zone: 'Hyderabad',
    town: 'HYDERABAD',
    schoolName: 'SRI BHARATHI VIDYALAYA TECHNO SCHOOL',
    executive: 'Sudeep',
    mobile: '9246941662',
    products: 'NCERT Book...',
    prodFinYear: '2025-26',
    schoolCode: 'Hyderabad061',
    po: 'placeholder',
    action: '',
    remarks: 'INTERESTED IN IIT NEET',
  },
  {
    createdOn: '17-Sep-2025 11:31:13 AM',
    schoolType: 'New',
    zone: 'Secunderabad',
    town: 'beerumguda',
    schoolName: 'Prism international school',
    executive: 'P Sridhar',
    mobile: '7675914379',
    products: 'NCERT Book...',
    prodFinYear: '2025-26',
    schoolCode: 'HYKUK4042',
    po: 'placeholder-stack',
    action: '',
    remarks: 'PO done',
  },
  {
    createdOn: '15-Sep-2025 05:59:06 PM',
    schoolType: 'New',
    zone: 'Secunderabad',
    town: 'Kukatpally',
    schoolName: 'Smart kennedy school',
    executive: 'P Sridhar',
    mobile: '9618293382',
    products: 'CodeChamp,...',
    prodFinYear: '2025-26',
    schoolCode: 'HYKUK4040',
    po: 'placeholder-stack',
    action: '',
    remarks: 'PO Dane',
  },
]

export default function ClosedSalesPage() {
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
        const data = await apiRequest<DcOrder[]>(`/dc-orders?status=completed`)
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
            <h1 className="text-xl font-semibold text-gray-900">Viswam Edutech - Closed Leads List</h1>
            <p className="text-sm text-gray-600 mt-1">Closed leads</p>
            <div className="text-sm text-gray-500 mt-2">Home &gt; Leads &gt; Closed leads</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border-b px-4 py-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
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
                placeholder="By Town" 
                className="bg-white border-gray-300"
              />
              <Input 
                placeholder="dd-mm-yyyy" 
                type="text"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input 
                placeholder="dd-mm-yyyy" 
                type="text"
                className="bg-white border-gray-300"
              />
              <Select>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="secunderabad">Secunderabad</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select Executive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sudeep">Sudeep</SelectItem>
                  <SelectItem value="p-sridhar">P Sridhar</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
            </div>
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
                      Created On
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
                      Products
                      <div className="flex flex-col">
                        <ChevronUp size={12} className="text-gray-400 -mb-1" />
                        <ChevronDown size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Prod Fin Year
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
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.createdOn}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.schoolType}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.zone}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.town}</td>
                    <td className="py-3 px-4 text-gray-900">{row.schoolName}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.executive}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.mobile}</td>
                    <td className="py-3 px-4">
                      <span className="text-blue-600 cursor-pointer hover:underline">{row.products}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.prodFinYear}</td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.schoolCode}</td>
                    <td className="py-3 px-4">
                      <div className="relative inline-block">
                        <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-500">PO</span>
                        </div>
                        {row.po === 'placeholder-stack' && (
                          <div className="absolute -right-2 -top-2 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-gray-600">...</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 whitespace-nowrap">{row.action}</td>
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
