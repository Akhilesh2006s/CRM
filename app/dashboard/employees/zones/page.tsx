'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'

type Zone = { _id?: string; name: string }

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<Zone[]>('/zones')
      setZones(Array.isArray(data) ? data : [])
    } catch (e: any) {
      alert(e?.message || 'Failed to load zones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      alert('Zone is required')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/zones', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      })
      setName('')
      load()
    } catch (e: any) {
      alert(e?.message || 'Failed to save zone')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id?: string) => {
    if (!id) return
    if (!confirm('Delete this zone?')) return
    try {
      await apiRequest(`/zones/${id}`, { method: 'DELETE' })
      load()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete zone')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Zones</h1>
      <Card className="p-4 md:p-6 bg-neutral-50 border border-neutral-200 space-y-4">
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Zone *</Label>
            <Input
              className="bg-white text-neutral-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Zone"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add Zone'}
            </Button>
            <Button type="button" variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </form>

        <Card className="p-0 overflow-x-auto bg-white border border-neutral-200">
          {loading ? (
            <div className="p-4 text-sm text-neutral-600">Loading zones…</div>
          ) : zones.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">No zones added yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b text-neutral-700">
                  <th className="py-2 px-3 text-left">Zone</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z._id || z.name} className="border-b last:border-0">
                    <td className="py-2 px-3">{z.name}</td>
                    <td className="py-2 px-3 text-right">
                      {z._id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => onDelete(z._id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Card>
    </div>
  )
}

