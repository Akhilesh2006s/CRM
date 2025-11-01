'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Pencil, CreditCard, ClipboardList } from 'lucide-react'

type Row = {
  _id: string
  dcNo: string
  dcDate?: string
  dcCategory?: string
  dcFinYear?: string
  schoolName?: string
  schoolCode?: string
  zone?: string
  executive?: string
}

export default function CompletedDCPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [isManager, setIsManager] = useState(false)
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [filters, setFilters] = useState({
    zone: '',
    employee: '',
    schoolCode: '',
    schoolName: '',
    fromDate: '',
    toDate: '',
  })

  // Check user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('authUser')
        if (raw) {
          const userData = JSON.parse(raw)
          setIsManager(userData.role === 'Manager')
          setIsCoordinator(userData.role === 'Co-ordinator')
        }
      } catch {}
    }
  }, [])

  async function load() {
    const qs = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && qs.append(k, v))
    // show only active (not on hold)
    qs.append('hold', 'false')
    try {
      const data = await apiRequest<Row[]>(`/warehouse/dc/list?${qs.toString()}`)
      setRows(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load DCs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function actionPlaceholder(msg: string) {
    toast.message(msg)
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">DC Completed List</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          <Input placeholder="Select Zone" value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })} />
          <Input placeholder="Select Employee" value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
          <Input placeholder="By School Code" value={filters.schoolCode} onChange={(e) => setFilters({ ...filters, schoolCode: e.target.value })} />
          <Input placeholder="By School Name" value={filters.schoolName} onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })} />
          <Input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          <Input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="mt-3">
          <Button onClick={load}>Search</Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-gray-900 font-bold">S.No</TableHead>
                <TableHead className="text-gray-900 font-bold">DC No</TableHead>
                <TableHead className="text-gray-900 font-bold">DC Date</TableHead>
                <TableHead className="text-gray-900 font-bold">DC Category</TableHead>
                <TableHead className="text-gray-900 font-bold">DC Fin Year</TableHead>
                <TableHead className="text-gray-900 font-bold">School Name</TableHead>
                <TableHead className="text-gray-900 font-bold">School Code</TableHead>
                <TableHead className="text-gray-900 font-bold">Zone</TableHead>
                <TableHead className="text-gray-900 font-bold">Executive</TableHead>
                <TableHead className="text-gray-900 font-bold">Completed Date</TableHead>
                <TableHead className="text-gray-900 font-bold">LR Info</TableHead>
                <TableHead className="text-gray-900 font-bold">LR Date</TableHead>
                <TableHead className="text-gray-900 font-bold">Action 1</TableHead>
                <TableHead className="text-gray-900 font-bold">Action 2</TableHead>
                <TableHead className="text-gray-900 font-bold">Remarks</TableHead>
                <TableHead className="text-gray-900 font-bold">Delivery Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-neutral-500">No records</TableCell>
                </TableRow>
              )}
              {rows.map((r, idx) => (
                <TableRow key={r._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcNo}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcDate ? new Date(r.dcDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcCategory || 'Term 2'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcFinYear || '-'}</TableCell>
                  <TableCell className="truncate max-w-[220px]">{r.schoolName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.schoolCode || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.zone || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.executive || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">-</TableCell>
                  <TableCell className="whitespace-nowrap">-</TableCell>
                  <TableCell className="whitespace-nowrap">-</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => actionPlaceholder('Action: open')}><ClipboardList size={14} /></Button>
                      <Button size="sm" variant="secondary" onClick={() => actionPlaceholder('Action: edit')}><Pencil size={14} /></Button>
                      <Button size="sm" variant="secondary" onClick={() => actionPlaceholder('Action: payment')}><CreditCard size={14} /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {!isManager && !isCoordinator && (
                      <Button size="sm" onClick={() => actionPlaceholder('Stock Return')}>Stock Return</Button>
                    )}
                    {(isManager || isCoordinator) && <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell className="truncate max-w-[240px]">-</TableCell>
                  <TableCell className="whitespace-nowrap">-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
