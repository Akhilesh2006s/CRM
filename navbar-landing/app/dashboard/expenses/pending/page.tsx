'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Pencil, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ExpenseRow = {
  _id: string
  employeeName?: string
  raisedDate: string | Date
  expType?: string
  category?: string
  amount: number
  pendingMonths?: string
  employeeId?: {
    _id: string
    name?: string
    email?: string
  }
  trainerId?: {
    _id: string
    name?: string
    email?: string
  }
}

export default function ManagerPendingExpensesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([])
  const [trainers, setTrainers] = useState<{ _id: string; name: string }[]>([])
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    employeeId: '',
    trainerId: '',
  })

  useEffect(() => {
    // Load employees and trainers for filters
    ;(async () => {
      try {
        const [eData, tData] = await Promise.all([
          apiRequest<any[]>('/employees?isActive=true').catch(() => []),
          apiRequest<any[]>('/trainers?status=active').catch(() => []),
        ])
        setEmployees(eData || [])
        setTrainers(tData || [])
      } catch {}
    })()
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filters.employeeId) qs.append('employeeId', filters.employeeId)
      if (filters.trainerId) qs.append('trainerId', filters.trainerId)

      const data = await apiRequest<ExpenseRow[]>(`/expenses/manager-pending?${qs.toString()}`)
      setRows(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load pending expenses')
    } finally {
      setLoading(false)
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  function getSortedRows() {
    if (!sortColumn) return rows

    return [...rows].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortColumn) {
        case 'employeeName':
          aVal = a.employeeName || ''
          bVal = b.employeeName || ''
          break
        case 'raisedDate':
          aVal = new Date(a.raisedDate).getTime()
          bVal = new Date(b.raisedDate).getTime()
          break
        case 'expType':
          aVal = a.expType || a.category || ''
          bVal = b.expType || b.category || ''
          break
        case 'amount':
          aVal = a.amount || 0
          bVal = b.amount || 0
          break
        case 'pendingMonths':
          aVal = a.pendingMonths || ''
          bVal = b.pendingMonths || ''
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  function handleEdit(id: string) {
    router.push(`/dashboard/expenses/pending/${id}`)
  }

  function formatDate(date: string | Date) {
    if (!date) return '-'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const sortedRows = getSortedRows()

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6 py-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Viswam Edutech - Manager Pending Expenses List
        </h1>
        <p className="text-sm text-neutral-600 mt-1">Manager Pending Expenses List</p>
      </div>

      <Card className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">Select Employee</label>
            <Select
              value={filters.employeeId || 'all'}
              onValueChange={(v) => setFilters({ ...filters, employeeId: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="bg-gray-100 text-neutral-900 border border-gray-300 w-full">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e._id} value={e._id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">Select Trainer</label>
            <Select
              value={filters.trainerId || 'all'}
              onValueChange={(v) => setFilters({ ...filters, trainerId: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="bg-gray-100 text-neutral-900 border border-gray-300 w-full">
                <SelectValue placeholder="Select Trainer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trainers</SelectItem>
                {trainers.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={load} className="bg-blue-600 hover:bg-blue-700 text-white h-10">
            Search
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-6">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-sky-50/70">
                <TableHead className="w-16 font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('sno')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    S.No
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('employeeName')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    Employee Name
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('raisedDate')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    Raised Date
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('expType')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    Exp Type
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    Amount
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-neutral-900">Action</TableHead>
                <TableHead className="font-semibold text-neutral-900">
                  <button
                    onClick={() => handleSort('pendingMonths')}
                    className="flex items-center gap-1 hover:text-blue-600 text-neutral-900"
                  >
                    Pending Months
                    <ArrowUpDown size={14} />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-neutral-500">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!loading && sortedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-neutral-500">
                    No pending expenses found
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                sortedRows.map((r, idx) => (
                  <TableRow key={r._id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.employeeName || r.employeeId?.name || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.raisedDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.expType || r.category || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.amount?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(r._id)}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 p-1"
                      >
                        <Pencil size={16} className="text-yellow-600" />
                      </Button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.pendingMonths || '-'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

