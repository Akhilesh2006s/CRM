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
  approvalAmount?: number
  employeeRemarks?: string
  managerRemarks?: string
  financeRemarks?: string
  billImage?: string
  employeeName?: string
  employeeId?: {
    _id: string
    name?: string
    email?: string
  }
  status?: string
}

export default function FinanceExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [editData, setEditData] = useState<Record<string, { approvalAmount: string; financeRemarks: string }>>({})

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        // First get the expense to find employee ID
        const expense = await apiRequest<ExpenseDetail>(`/expenses/${id}`)
        const employeeId = expense.employeeId?._id || expense.employeeId
        
        if (!employeeId) {
          toast.error('Employee not found')
          router.push('/dashboard/expenses/finance-pending')
          return
        }

        // Get all finance pending expenses for this employee
        const allExpenses = await apiRequest<ExpenseDetail[]>(`/expenses/finance-pending?employeeId=${employeeId}`)
        setExpenses(allExpenses)

        // Initialize edit data
        const initialEditData: Record<string, { approvalAmount: string; financeRemarks: string }> = {}
        allExpenses.forEach((exp) => {
          initialEditData[exp._id] = {
            approvalAmount: (exp.approvalAmount || exp.amount || 0).toString(),
            financeRemarks: exp.financeRemarks || '',
          }
        })
        setEditData(initialEditData)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load expense details')
        router.push('/dashboard/expenses/finance-pending')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  async function handleApprove() {
    if (!expenses.length) return

    setSaving(true)
    try {
      // Update all expenses with status 'Approved'
      const updatePromises = expenses.map((expense) => {
        const editValues = editData[expense._id]
        if (!editValues) return Promise.resolve()

        const updateData: any = {
          status: 'Approved',
        }
        if (editValues.approvalAmount) {
          const amount = parseFloat(editValues.approvalAmount)
          if (isNaN(amount)) {
            throw new Error(`Invalid approval amount for expense ${expense.expItemId}`)
          }
          updateData.approvalAmount = amount
        }
        if (editValues.financeRemarks !== undefined) {
          updateData.financeRemarks = editValues.financeRemarks
        }

        return apiRequest(`/expenses/${expense._id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      })

      await Promise.all(updatePromises)
      toast.success('Expenses approved successfully')
      router.push('/dashboard/expenses/finance-pending')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve expenses')
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

  function handleFieldChange(expenseId: string, field: 'approvalAmount' | 'financeRemarks', value: string) {
    setEditData((prev) => ({
      ...prev,
      [expenseId]: {
        ...prev[expenseId],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center text-neutral-500">Loading expense details...</div>
      </div>
    )
  }

  if (!expenses.length) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center text-neutral-500">No expenses found</div>
      </div>
    )
  }

  const employeeName = expenses[0]?.employeeName || expenses[0]?.employeeId?.name || 'Unknown Employee'

  // Filter expenses by date range if provided
  const filteredExpenses = expenses.filter((exp) => {
    if (!fromDate && !toDate) return true
    const expenseDate = new Date(exp.dateOfExpense || exp.date || exp.raisedDate || exp.createdAt)
    if (fromDate && expenseDate < new Date(fromDate)) return false
    if (toDate && expenseDate > new Date(toDate)) return false
    return true
  })

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            Viswam Edutech - Finance Expense Update
          </h1>
          <p className="text-sm text-neutral-600 mt-1">Finance Expense Update</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/expenses/finance-pending')}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <p className="text-lg font-medium text-neutral-700">Employee : {employeeName}</p>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>From Date</Label>
            <Input
              type="date"
              placeholder="dd-mm-yyyy"
              className="bg-gray-100"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <Label>To Date</Label>
            <Input
              type="date"
              placeholder="dd-mm-yyyy"
              className="bg-gray-100"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
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
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Date of Expense</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Description</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Emp.Price</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Mngr.Price</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Mngr.Remarks</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Approval Amount</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Fin Remarks</th>
                <th className="py-2 px-3 text-left font-semibold text-neutral-900">Bill Image</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, idx) => {
                const editValues = editData[expense._id] || {
                  approvalAmount: (expense.approvalAmount || expense.amount || 0).toString(),
                  financeRemarks: expense.financeRemarks || '',
                }
                return (
                  <tr key={expense._id} className="border-b">
                    <td className="py-2 px-3">{idx + 1}</td>
                    <td className="py-2 px-3">{expense.expItemId || expense._id.substring(0, 5)}</td>
                    <td className="py-2 px-3">{expense.expType || expense.category || '-'}</td>
                    <td className="py-2 px-3 text-red-600 font-medium">
                      {expense.gpsDistance || '-'}
                    </td>
                    <td className="py-2 px-3">{formatDate(expense.dateOfExpense || expense.date)}</td>
                    <td className="py-2 px-3 max-w-[250px]">
                      <Textarea
                        value={expense.expenseDescription || expense.description || ''}
                        readOnly
                        className="min-w-[200px] resize-none bg-gray-50"
                        rows={2}
                      />
                    </td>
                    <td className="py-2 px-3">{(expense.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3">{(expense.approvalAmount || expense.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 max-w-[150px]">
                      <Input
                        value={expense.managerRemarks || ''}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Manager Remarks"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.approvalAmount}
                        onChange={(e) => handleFieldChange(expense._id, 'approvalAmount', e.target.value)}
                        className="w-24"
                        placeholder="Amount"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Textarea
                        value={editValues.financeRemarks}
                        onChange={(e) => handleFieldChange(expense._id, 'financeRemarks', e.target.value)}
                        placeholder="Finance Remarks"
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
                        <span className="text-neutral-400 text-xs flex items-center gap-1">
                          <ImageIcon size={14} />
                          Image 1
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/expenses/finance-pending')}>
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

