'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Lead = {
  _id: string
  school_name?: string
  name?: string
  contact_person?: string
  contact_mobile?: string
  phone?: string
  products?: string
  location?: string
  zone?: string
  priority?: 'Hot' | 'Warm' | 'Cold'
  status?: 'Pending' | 'Processing' | 'Saved' | 'Closed' | 'New' | string
  remarks?: string
}

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const data = await apiRequest<Lead>(`/leads/${id}`)
        setLead(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load lead')
      }
    })()
  }, [id])

  const update = (patch: Partial<Lead>) => setLead((l) => (l ? { ...l, ...patch } : l))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead) return
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        school_name: lead.school_name || lead.name,
        contact_person: lead.contact_person,
        contact_mobile: lead.contact_mobile || lead.phone,
        products: lead.products,
        location: lead.location,
        zone: lead.zone,
        priority: lead.priority,
        status: lead.status,
        remarks: lead.remarks,
      }
      await apiRequest(`/leads/${lead._id}`, { method: 'PUT', body: JSON.stringify(payload) })
      router.push('/dashboard/dc/pending')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!lead) {
    return <div className="p-4 text-sm text-neutral-600">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Edit Deal</h1>
      <Card className="p-4 md:p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>School name</Label>
            <Input value={lead.school_name || lead.name || ''} onChange={(e) => update({ school_name: e.target.value })} />
          </div>
          <div>
            <Label>Contact person</Label>
            <Input value={lead.contact_person || ''} onChange={(e) => update({ contact_person: e.target.value })} />
          </div>
          <div>
            <Label>Contact mobile</Label>
            <Input value={lead.contact_mobile || lead.phone || ''} onChange={(e) => update({ contact_mobile: e.target.value })} />
          </div>
          <div>
            <Label>Zone</Label>
            <Input value={lead.zone || ''} onChange={(e) => update({ zone: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Products</Label>
            <Textarea value={lead.products || ''} onChange={(e) => update({ products: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={lead.status as string} onValueChange={(v) => update({ status: v })}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Saved">Saved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={lead.priority as string} onValueChange={(v) => update({ priority: v as any })}>
              <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Remarks</Label>
            <Textarea value={lead.remarks || ''} onChange={(e) => update({ remarks: e.target.value })} />
          </div>
          {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}



