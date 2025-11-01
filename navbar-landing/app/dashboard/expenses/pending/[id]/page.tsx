'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Image as ImageIcon, ArrowLeft } from 'lucide-react'

type ExpenseDetail = {
  _id: string
  expItemId?: string
  expType?: string
  category?: string
  gpsDistance?: string
  expenseDescription?: string
  dateOfExpense?: string | Date
  amount: number
  employeeRemarks?: string
  approvalAmount?: number
  managerRemarks?: string
  billImage?: string
  employeeName?: string
  employeeId?: {
    _id: string
    name?: string
    email?: string
  }
  status?: string
}

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [expense, setExpense] = useState<ExpenseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approvalAmount, setApprovalAmount] = useState<string>('')
  const [managerRemarks, setManagerRemarks] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const data = await apiRequest<ExpenseDetail>(`/expenses/${id}`)
        setExpense(data)
        setApprovalAmount(data.approvalAmount?.toString() || data.amount?.toString() || '')
        setManagerRemarks(data.managerRemarks || '')
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load expense details')
        router.push('/dashboard/expenses/pending')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  async function handleApprove() {
    if (!expense) return

    setSaving(true)
    try {
      const updateData: any = {
        status: 'Finance Pending',
      }
      if (approvalAmount) {
        const amount = parseFloat(approvalAmount)
        if (isNaN(amount)) {
          toast.error('Please enter a valid approval amount')
          setSaving(false)
          return
        }
        updateData.approvalAmount = amount
      }
      if (managerRemarks !== undefined) {
        updateData.managerRemarks = managerRemarks
      }

      await apiRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      toast.success('Expense approved successfully')
      router.push('/dashboard/expenses/pending')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve expense')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(date: string | Date | undefined) {
    if (!date) return '-'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center text-neutral-500">Loading expense details...</div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center text-neutral-500">Expense not found</div>
      </div>
    )
  }

  const employeeName = expense.employeeName || expense.employeeId?.name || 'Unknown Employee'

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            Viswam Edutech - Manager Expense Update
          </h1>
          <p className="text-sm text-neutral-600 mt-1">Manager Expense Update</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/expenses/pending')}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <p className="text-lg font-medium text-neutral-700">Employee: {employeeName}</p>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>From Date</Label>
            <Input type="date" placeholder="dd-mm-yyyy" className="bg-gray-100" />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" placeholder="dd-mm-yyyy" className="bg-gray-100" />
          </div>
          <div className="flex items-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
          </div>
        </div>

        <div className="mb-4">
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            View Employee Track
          </Button>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-sky-50/70 border-b">
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">S.No</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Exp Item ID</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Expense Type</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">GPS Dist</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Description</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Date of Expense</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Amount</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Emp.Remarks</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Approval Amount</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Mngr.Remarks</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Bill Image</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">1</td>
                <td className="py-2 px-3">{expense.expItemId || expense._id.substring(0, 5)}</td>
                <td className="py-2 px-3">{expense.expType || expense.category || '-'}</td>
                <td className="py-2 px-3">{expense.gpsDistance || '-'}</td>
                <td className="py-2 px-3 max-w-[300px] truncate">
                  {expense.expenseDescription || expense.description || '-'}
                </td>
                <td className="py-2 px-3">{formatDate(expense.dateOfExpense || expense.date)}</td>
                <td className="py-2 px-3">{expense.amount?.toFixed(2) || '0.00'}</td>
                <td className="py-2 px-3 max-w-[200px] truncate">{expense.employeeRemarks || '-'}</td>
                <td className="py-2 px-3">
                  <Input
                    type="number"
                    step="0.01"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(e.target.value)}
                    className="w-24"
                    placeholder="Amount"
                  />
                </td>
                <td className="py-2 px-3">
                  <Textarea
                    value={managerRemarks}
                    onChange={(e) => setManagerRemarks(e.target.value)}
                    placeholder="Manager Remarks"
                    className="min-w-[200px]"
                    rows={2}
                  />
                </td>
                <td className="py-2 px-3">
                  {expense.billImage ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(expense.billImage, '_blank')}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <ImageIcon size={14} className="mr-1" />
                      Image 1
                    </Button>
                  ) : (
                    <span className="text-neutral-400 text-xs">No image</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/expenses/pending')}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
            {saving ? 'Approving...' : 'Approved'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

