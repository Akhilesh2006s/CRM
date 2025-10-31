'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type DCRow = {
  _id: string
  dcNo: string
  dcDate: string
  executive: string
  schoolCode: string
  schoolName: string
  schoolType: string
  dcFinYear: string
  dcCategory: string
  zone: string
  products: string
  dcRemarks: string
  smeFin?: string
  hold?: boolean
}

export default function WarehouseDcAtWarehouse() {
  const router = useRouter()
  const [rows, setRows] = useState<DCRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    zone: '',
    employee: '',
    schoolCode: '',
    schoolName: '',
    dcNo: '',
    fromDate: '',
    toDate: '',
  })

  async function load() {
    const qs = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && qs.append(k, v))
    // Show only active (not on hold) DCs
    qs.append('hold', 'false')
    try {
      const data = await apiRequest<DCRow[]>(`/warehouse/dc/list?${qs.toString()}`)
      setRows(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load DC list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleHold(id: string) {
    try {
      // Optimistically remove the row from the UI
      setRows((prev) => prev.filter((r) => r._id !== id))
      await apiRequest(`/warehouse/dc/${id}/hold`, { method: 'POST' })
      // Ensure consistency with backend (in case of filters)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update hold')
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">DC List</h1>
        </div>
      </div>

      <Card className="p-6 rounded-lg border border-neutral-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Select Zone</div>
            <Input className="w-full" placeholder="Zone" value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Select Employee</div>
            <Input className="w-full" placeholder="Employee" value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">By School Code</div>
            <Input className="w-full" placeholder="School Code" value={filters.schoolCode} onChange={(e) => setFilters({ ...filters, schoolCode: e.target.value })} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">By School Name</div>
            <Input className="w-full" placeholder="School Name" value={filters.schoolName} onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">By DC No</div>
            <Input className="w-full" placeholder="DC No" value={filters.dcNo} onChange={(e) => setFilters({ ...filters, dcNo: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">From Date</div>
            <Input className="w-full" type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">To Date</div>
            <Input className="w-full" type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
          </div>
          <div className="pb-1">
            <Button onClick={load}>Search</Button>
          </div>
        </div>

        <div className="overflow-x-auto mt-4 rounded-md">
          <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>DC No</TableHead>
              <TableHead>DC Date</TableHead>
              <TableHead className="hidden lg:table-cell">Executive</TableHead>
              <TableHead className="hidden md:table-cell">School Code</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead className="hidden lg:table-cell">School Type</TableHead>
              <TableHead className="hidden xl:table-cell">DC Fin Year</TableHead>
              <TableHead className="hidden xl:table-cell">DC Category</TableHead>
              <TableHead className="hidden md:table-cell">Zone</TableHead>
              <TableHead className="hidden xl:table-cell">Products</TableHead>
              <TableHead className="hidden lg:table-cell">DC Remarks</TableHead>
              <TableHead className="hidden xl:table-cell">SME & FIN</TableHead>
              <TableHead className="w-20">Action</TableHead>
              <TableHead className="w-16">Hold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-neutral-500">No records</TableCell>
              </TableRow>
            )}
            {rows.map((r, idx) => (
              <TableRow key={r._id}>
                <TableCell className="whitespace-nowrap">{idx + 1}</TableCell>
                <TableCell className="whitespace-nowrap">{r.dcNo}</TableCell>
                <TableCell className="whitespace-nowrap">{new Date(r.dcDate).toLocaleDateString()}</TableCell>
                <TableCell className="hidden lg:table-cell whitespace-nowrap">{r.executive}</TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap">{r.schoolCode}</TableCell>
                <TableCell className="truncate max-w-[160px]">{r.schoolName}</TableCell>
                <TableCell className="hidden lg:table-cell whitespace-nowrap">{r.schoolType}</TableCell>
                <TableCell className="hidden xl:table-cell whitespace-nowrap">{r.dcFinYear}</TableCell>
                <TableCell className="hidden xl:table-cell whitespace-nowrap">{r.dcCategory}</TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap">{r.zone}</TableCell>
                <TableCell className="hidden xl:table-cell truncate max-w-[160px]">{r.products}</TableCell>
                <TableCell className="hidden lg:table-cell truncate max-w-[200px]">{r.dcRemarks}</TableCell>
                <TableCell className="hidden xl:table-cell truncate max-w-[140px]">{r.smeFin || ''}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/warehouse/dc-at-warehouse/${r._id}`)}>
                      <Pencil size={16} className="mr-1" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/warehouse/dc-at-warehouse/${r._id}?mode=edit`)}>
                      Update
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {r.hold ? (
                    <span className="text-xs px-2 py-1 rounded bg-neutral-200 text-neutral-700">On Hold</span>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => toggleHold(r._id)}>
                      HOLD
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

