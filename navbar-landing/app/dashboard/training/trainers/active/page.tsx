'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type Trainer = { _id: string; name: string; email?: string; mobile?: string; zone?: string; trainerProducts?: string[]; trainerLevels?: string; trainerType?: string }

export default function ActiveTrainersPage() {
  const [items, setItems] = useState<Trainer[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<Trainer[]>(`/trainers?status=active&q=${encodeURIComponent(q)}`)
      setItems(data)
    } catch (e) {
      toast.error('Failed to load trainers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const resetPassword = async (id: string) => {
    try {
      await apiRequest(`/trainers/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({}) })
      toast.success('Password reset to Password123')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset password')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Active Trainers</h1>
      <form onSubmit={(e)=>{e.preventDefault(); load()}} className="flex gap-2 items-end">
        <div className="min-w-[240px]">
          <Input placeholder="Search name / email / mobile" value={q} onChange={(e)=>setQ(e.target.value)} className="bg-white text-neutral-900" />
        </div>
        <Button type="submit">Search</Button>
      </form>
      <Card className="p-0 overflow-x-auto">
        {loading && <div className="p-4">Loading…</div>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50/70 border-b text-neutral-700">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3">Mobile</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3 text-left">Products</th>
                <th className="py-2 px-3">Levels</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={7} className="py-4 px-3 text-center text-neutral-500">No trainers found</td></tr>
              )}
              {items.map(t => (
                <tr key={t._id} className="border-b last:border-0">
                  <td className="py-2 px-3 text-left">{t.name}</td>
                  <td className="py-2 px-3">{t.mobile || '-'}</td>
                  <td className="py-2 px-3">{t.zone || '-'}</td>
                  <td className="py-2 px-3 text-left">{(t.trainerProducts||[]).join(', ')}</td>
                  <td className="py-2 px-3">{t.trainerLevels || '-'}</td>
                  <td className="py-2 px-3">{t.trainerType || '-'}</td>
                  <td className="py-2 px-3 text-right">
                    <Button size="sm" variant="secondary" onClick={()=>resetPassword(t._id)}>Reset Password</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}


