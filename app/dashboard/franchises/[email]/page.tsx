'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/api'
import { Building2, Mail, MapPin, Phone, Users, Package, DollarSign, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type School = {
  _id: string
  schoolName: string
  schoolCode?: string
  zone?: string
  location?: string
  contactPerson?: string
  contactMobile?: string
  products: string[]
  franchises: Array<{ name: string; cost: number }>
}

type Product = {
  productId: string
  productName: string
  defaultCost: number
  franchises: Array<{
    franchiseName: string
    franchiseEmail: string
    franchiseCost: number
    zones: string[]
    schoolCount: number
  }>
}

type FranchiseDashboardData = {
  franchiseEmail: string
  franchiseName: string
  assignedSchools: School[]
  products: Product[]
  totalSchools: number
  totalZones: number
  zones: string[]
}

export default function FranchiseDashboardPage() {
  const params = useParams()
  const franchiseEmail = params.email as string
  const [data, setData] = useState<FranchiseDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!franchiseEmail) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const decodedEmail = decodeURIComponent(franchiseEmail)
        const res = await apiRequest<FranchiseDashboardData>(`/franchises/${encodeURIComponent(decodedEmail)}/dashboard`)
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Failed to load franchise dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [franchiseEmail])

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-neutral-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading franchise dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Link href="/dashboard/products/vendors" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back to partners
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-neutral-500">
          <p>No franchise data found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/products/vendors"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Partners
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Franchise Dashboard</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 text-neutral-600">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{data.franchiseName || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{data.franchiseEmail}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">Total Schools</div>
              <div className="text-2xl font-bold text-indigo-900">{data.totalSchools}</div>
            </div>
            <Building2 className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Total Zones</div>
              <div className="text-2xl font-bold text-emerald-900">{data.totalZones}</div>
            </div>
            <MapPin className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Products</div>
              <div className="text-2xl font-bold text-amber-900">{data.products.length}</div>
            </div>
            <Package className="w-8 h-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-purple-700 mb-1 uppercase tracking-wide">Franchises</div>
              <div className="text-2xl font-bold text-purple-900">
                {data.products.reduce((sum, p) => sum + p.franchises.length, 0)}
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Assigned Schools Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Assigned Schools ({data.assignedSchools.length})</h2>
        </div>

        {data.assignedSchools.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p>No schools assigned to this franchise yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>School Code</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Mobile</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Franchise Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assignedSchools.map((school) => (
                  <TableRow key={school._id}>
                    <TableCell className="font-medium">{school.schoolName}</TableCell>
                    <TableCell>
                      {school.schoolCode ? (
                        <Badge variant="secondary">{school.schoolCode}</Badge>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{school.zone || '-'}</TableCell>
                    <TableCell>{school.location || '-'}</TableCell>
                    <TableCell>{school.contactPerson || '-'}</TableCell>
                    <TableCell>
                      {school.contactMobile ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{school.contactMobile}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {school.products.map((product, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {school.franchises.map((franchise, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="text-sm font-medium">₹{franchise.cost.toFixed(2)}</span>
                            <span className="text-xs text-neutral-500">({franchise.name})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Products & Franchises */}
      {data.products.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Products & Franchises</h2>
          <div className="space-y-4">
            {data.products.map((product) => (
              <div key={product.productId} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-neutral-900">{product.productName}</h3>
                  </div>
                  <Badge variant="outline">Default: ₹{product.defaultCost.toFixed(2)}</Badge>
                </div>
                <div className="space-y-2">
                  {product.franchises.map((franchise, idx) => (
                    <div key={idx} className="bg-neutral-50 rounded p-3 border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{franchise.franchiseName}</div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {franchise.zones.length} zone(s) • {franchise.schoolCount} school(s)
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          ₹{franchise.franchiseCost.toFixed(2)}
                        </Badge>
                      </div>
                      {franchise.zones.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {franchise.zones.map((zone, zIdx) => (
                            <Badge key={zIdx} variant="secondary" className="text-xs">
                              {zone}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
