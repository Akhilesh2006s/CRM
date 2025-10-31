'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

const PAYMENT_MODES = ['Cash', 'Cheque', 'Online Payment']

type School = {
  _id: string
  schoolCode: string
  schoolName: string
  contactName?: string
  mobileNumber?: string
  avgStrength?: number
  location?: string
}

export default function AddPaymentPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [school, setSchool] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [financialYear, setFinancialYear] = useState('2024-25')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSchools() {
      try {
        const data = await apiRequest<School[]>('/schools')
        setSchools(data)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load schools')
      } finally {
        setLoading(false)
      }
    }
    loadSchools()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!school || !amount) {
      toast.error('Please fill school and amount')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          customerName: school,
          amount: Number(amount),
          paymentMethod: mode,
          financialYear,
          description: remarks,
        }),
      })
      toast.success('Payment added')
      setSchool('')
      setAmount('')
      setRemarks('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Add Payment</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-500">School *</div>
              <select
                className="w-full border rounded px-2 py-2 bg-neutral-900 text-white"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                disabled={loading}
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s._id} value={s.schoolName}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Amount *</div>
              <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-neutral-500">Payment Mode *</div>
              <select className="w-full border rounded px-2 py-2 bg-neutral-900 text-white" value={mode} onChange={(e) => setMode(e.target.value)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Financial Year *</div>
              <select className="w-full border rounded px-2 py-2 bg-neutral-900 text-white" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                {['2024-25', '2025-26', '2026-27'].map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-neutral-500">Remarks *</div>
              <Input placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Payment'}</Button>
        </form>
      </Card>
    </div>
  )
}
