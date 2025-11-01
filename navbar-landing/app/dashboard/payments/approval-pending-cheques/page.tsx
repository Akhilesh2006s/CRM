'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

type PaymentRow = {
  _id: string
  schoolCode?: string
  customerName: string
  contactName?: string
  mobileNumber?: string
  location?: string
  paymentDate: string
  createdBy?: {
    name?: string
    email?: string
  }
  amount: number
  paymentMethod: string
  financialYear?: string
  chqDate?: string
  refNo?: string
  submissionNo?: string
  handoverRemarks?: string
}

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Other', 'Cheque']

export default function ApprovalPendingChequesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [filters, setFilters] = useState({
    schoolCode: '',
    schoolName: '',
    mobileNo: '',
    paymentMode: 'Cheque', // Default to Cheque
    executive: '',
    zone: '',
    fromDate: '',
    toDate: '',
  })

  async function load() {
    setLoading(true)
    const qs = new URLSearchParams()
    // Always filter for Pending status and Cheque payment mode
    qs.append('status', 'Pending')
    qs.append('paymentMode', filters.paymentMode || 'Cheque')
    
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== 'paymentMode') {
        if (k === 'fromDate') qs.append('startDate', v)
        else if (k === 'toDate') qs.append('endDate', v)
        else if (k === 'mobileNo') qs.append('mobileNo', v)
        else if (k === 'executive') qs.append('employee', v)
        else qs.append(k, v)
      }
    })
    
    try {
      const data = await apiRequest<PaymentRow[]>(`/payments?${qs.toString()}`)
      setRows(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load pending cheque payments')
    } finally {
      setLoading(false)
    }
  }

  // Check user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('authUser')
        if (raw) {
          const userData = JSON.parse(raw)
          setIsCoordinator(userData.role === 'Co-ordinator')
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    load()
  }, [])

  function handleEdit(id: string) {
    router.push(`/dashboard/payments/approval-pending-cheques/${id}`)
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Pending Payments</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <Input
            placeholder="By School Code"
            value={filters.schoolCode}
            onChange={(e) => setFilters({ ...filters, schoolCode: e.target.value })}
          />
          <Input
            placeholder="By School Name"
            value={filters.schoolName}
            onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })}
          />
          <Input
            placeholder="By Mobile No"
            value={filters.mobileNo}
            onChange={(e) => setFilters({ ...filters, mobileNo: e.target.value })}
          />
          <Input
            type="date"
            placeholder="From Date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="To Date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          />
          <select
            className="w-full border rounded px-2 py-2 bg-neutral-900 text-white"
            value={filters.paymentMode}
            onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
          >
            <option value="Cheque">Cheque</option>
            {PAYMENT_MODES.filter((m) => m !== 'Cheque').map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input
            placeholder="Select Executive"
            value={filters.executive}
            onChange={(e) => setFilters({ ...filters, executive: e.target.value })}
          />
          <Input
            placeholder="Select Zone"
            value={filters.zone}
            onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <Button onClick={load}>Search</Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <Table className="min-w-[1800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-gray-900 font-bold">S.No</TableHead>
                <TableHead className="text-gray-900 font-bold">School Code</TableHead>
                <TableHead className="text-gray-900 font-bold">School Name</TableHead>
                <TableHead className="text-gray-900 font-bold">Contact Name</TableHead>
                <TableHead className="text-gray-900 font-bold">Mobile</TableHead>
                <TableHead className="text-gray-900 font-bold">Location</TableHead>
                <TableHead className="text-gray-900 font-bold">Date of Pay</TableHead>
                <TableHead className="text-gray-900 font-bold">Added By</TableHead>
                <TableHead className="text-gray-900 font-bold">Amount</TableHead>
                <TableHead className="text-gray-900 font-bold">Payment Mode</TableHead>
                <TableHead className="text-gray-900 font-bold">Payment Fin Year</TableHead>
                <TableHead className="text-gray-900 font-bold">Chq Date</TableHead>
                <TableHead className="text-gray-900 font-bold">Submission No</TableHead>
                <TableHead className="text-gray-900 font-bold">Handover Remarks</TableHead>
                {!isCoordinator && <TableHead className="text-gray-900 font-bold">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isCoordinator ? 14 : 15} className="text-center text-neutral-500">
                    No pending cheque payments found
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, idx) => (
                <TableRow key={r._id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.schoolCode || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.customerName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.contactName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.mobileNumber || '-'}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{r.location || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.paymentDate
                      ? new Date(r.paymentDate).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.createdBy?.name || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.paymentMethod || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.financialYear || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.chqDate ? new Date(r.chqDate).toLocaleDateString('en-GB') : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.submissionNo || r.refNo || '-'}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{r.handoverRemarks || '-'}</TableCell>
                  {!isCoordinator && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(r._id)}
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
