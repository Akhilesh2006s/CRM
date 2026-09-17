'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'
import { toast } from 'sonner'

type Lead = {
  _id: string
  school_name?: string
  school_code?: string
  contact_person?: string
  contact_mobile?: string
  zone?: string
  status?: string
  priority?: string
  lead_type?: string
  follow_up_date?: string
}

export default function CrossSaleLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<Lead[]>('/leads?lead_type=cross_sale')
      setLeads(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load cross-sale leads')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = leads.filter((l) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [l.school_name, l.school_code, l.contact_person, l.zone]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cross-Sale Leads</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Upsell / cross-sell pipeline for existing schools
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            className="w-56 bg-white"
            placeholder="Search school / zone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No cross-sale leads yet. Create a lead with type Cross Sale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-3 py-2 text-left">School</th>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Zone</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l._id} className="border-t">
                    <td className="px-3 py-2 font-medium">{l.school_name || '-'}</td>
                    <td className="px-3 py-2">{l.school_code || '-'}</td>
                    <td className="px-3 py-2">
                      {l.contact_person || '-'}
                      {l.contact_mobile ? (
                        <div className="text-xs text-neutral-500">{l.contact_mobile}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{l.zone || '-'}</td>
                    <td className="px-3 py-2">{l.status || '-'}</td>
                    <td className="px-3 py-2">{l.priority || '-'}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/leads/edit/${l._id}`}
                        className="text-teal-700 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
