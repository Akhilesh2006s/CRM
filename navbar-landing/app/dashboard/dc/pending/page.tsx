'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type DcOrder = {
  _id: string
  dc_code?: string
  school_name?: string
  contact_person?: string
  contact_mobile?: string
  products?: any
  location?: string
  zone?: string
  status?: string
}

export default function PendingDCPage() {
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [zone, setZone] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'pending')
      if (q) params.set('q', q)
      if (zone) params.set('zone', zone)
      if (leadStatus) params.set('lead_status', leadStatus)
      if (assignedTo) params.set('assigned_to', assignedTo)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const data = await apiRequest<DcOrder[]>(`/dc-orders?${params.toString()}`)
      setItems(Array.isArray(data) ? data : [])
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markSaved = async (id: string) => {
    try {
      await apiRequest(`/dc-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'saved' }) })
      load()
    } catch (e) {
      console.error(e)
      alert('Failed to save. Please ensure you are logged in.')
    }
  }

  const markClosed = async (id: string) => {
    try {
      await apiRequest(`/dc-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) })
      load()
    } catch (e) {
      console.error(e)
      alert('Failed to close. Please ensure you are logged in.')
    }
  }

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Pending DC (Processing)</h1>
        <Link href="/dashboard/dc/create"><Button>Create Sale</Button></Link>
      </div>
      <form onSubmit={search} className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Search school/contact/product" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder="Zone" value={zone} onChange={(e) => setZone(e.target.value)} />
        <Select value={leadStatus} onValueChange={setLeadStatus}>
          <SelectTrigger><SelectValue placeholder="Lead status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Hot">Hot</SelectItem>
            <SelectItem value="Warm">Warm</SelectItem>
            <SelectItem value="Cold">Cold</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Assigned To (user id)" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="md:col-span-6 flex gap-2">
          <Button type="submit">Search</Button>
          <Button type="button" variant="secondary" onClick={() => { setQ(''); setZone(''); setLeadStatus(''); setAssignedTo(''); setFrom(''); setTo(''); load(); }}>Reset</Button>
        </div>
      </form>
      <Card className="p-0 text-neutral-900 overflow-x-auto">
        {loading && <div className="p-4">Loading...</div>}
        {!loading && items.length === 0 && <div className="p-4">No deals.</div>}
        {!loading && items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50/70 border-b text-neutral-700">
                <th className="py-2 px-3 text-left">S.No</th>
                <th className="py-2 px-3 text-left">DC Code</th>
                <th className="py-2 px-3 text-left">School Name</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3">Mobile</th>
                <th className="py-2 px-3 text-left">Zone</th>
                <th className="py-2 px-3 text-left">Products</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((d) => {
                  const s = `${d.school_name || d.name || ''} ${d.contact_person || ''} ${d.contact_mobile || d.phone || ''} ${d.products || ''}`.toLowerCase()
                  return s.includes(q.toLowerCase())
                })
                .map((d, idx) => (
                <tr key={d._id} className="border-b last:border-0">
                  <td className="py-2 px-3">{idx + 1}</td>
                  <td className="py-2 px-3">{d.dc_code || '-'}</td>
                  <td className="py-2 px-3 font-medium">
                    {d._id ? (
                      <Link className="underline-offset-2 hover:underline" href={`/dashboard/dc/edit/${d._id}`}>
                        {d.school_name || '-'}
                      </Link>
                    ) : (d.school_name || '-')}
                  </td>
                  <td className="py-2 px-3 text-center">{d.contact_person || '-'}</td>
                  <td className="py-2 px-3 text-center">{d.contact_mobile || '-'}</td>
                  <td className="py-2 px-3 text-center">{d.zone || '-'}</td>
                  <td className="py-2 px-3 truncate max-w-[280px]">{Array.isArray(d.products) ? d.products.map(p=>p.product_name).join(', ') : '-'}</td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2 justify-end items-center">
                      <Select defaultValue="pending" onValueChange={(v) => apiRequest(`/dc-orders/${d._id}`, { method: 'PUT', body: JSON.stringify({ status: v }) }).then(load).catch(()=>alert('Failed'))}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saved">Saved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_transit">In-Transit</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="hold">Hold</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input className="w-40" placeholder="Assign user id" onBlur={(e) => e.target.value && apiRequest(`/dc-orders/${d._id}`, { method: 'PUT', body: JSON.stringify({ assigned_to: e.target.value }) }).then(load)} />
                    </div>
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
