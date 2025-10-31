'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type HoldRow = {
  _id: string
  dcNo: string
  dcDate?: string
  dcFinYear?: string
  schoolType?: string
  schoolName?: string
  schoolCode?: string
  zone?: string
  executive?: string
  holdRemarks?: string
}

export default function HoldDCPage() {
  const [rows, setRows] = useState<HoldRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await apiRequest<HoldRow[]>('/warehouse/hold-dc/list')
      setRows(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load held DCs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function moveToWarehouse(id: string) {
    try {
      // Unhold and remove from list
      await apiRequest(`/warehouse/dc/${id}/hold`, { method: 'POST' })
      setRows((prev) => prev.filter((r) => r._id !== id))
    } catch (err: any) {
      toast.error(err?.message || 'Failed to move DC')
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">DC Hold List</h1>
        <div className="overflow-x-auto mt-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">S.No</TableHead>
                <TableHead>DC No</TableHead>
                <TableHead>DC Date</TableHead>
                <TableHead>DC Fin Year</TableHead>
                <TableHead>School Type</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>School Code</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Executive</TableHead>
                <TableHead>Hold Remarks</TableHead>
                <TableHead className="w-48">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-neutral-500">No DCs on hold</TableCell>
                </TableRow>
              )}
              {rows.map((r, idx) => (
                <TableRow key={r._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcNo}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcDate ? new Date(r.dcDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.dcFinYear || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.schoolType || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.schoolName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.schoolCode || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.zone || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.executive || '-'}</TableCell>
                  <TableCell className="truncate max-w-[240px]">{r.holdRemarks || '-'}</TableCell>
                  <TableCell>
                    <Button variant="destructive" onClick={() => moveToWarehouse(r._id)}>
                      Move to DC@Warehouse
                    </Button>
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
