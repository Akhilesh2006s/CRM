'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type Item = {
  _id: string
  title: string
  type: string
  url: string
  description?: string
  product?: string
  isActive?: boolean
}

export default function SalesCollateralPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('link')
  const [description, setDescription] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<Item[]>('/collateral?active=0')
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load collateral')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Title and URL are required')
      return
    }
    try {
      await apiRequest('/collateral', {
        method: 'POST',
        body: JSON.stringify({ title, url, type, description }),
      })
      setTitle('')
      setUrl('')
      setDescription('')
      toast.success('Collateral added')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sales Collateral</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Demo videos, PPTs and brochures for field visits
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Title</Label>
            <Input className="bg-white" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>URL</Label>
            <Input className="bg-white" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="ppt">PPT</SelectItem>
                <SelectItem value="brochure">Brochure</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={add} className="w-full">
              Add
            </Button>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input
            className="bg-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No collateral yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Link</th>
                <th className="px-3 py-2 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.title}</td>
                  <td className="px-3 py-2">{item.type}</td>
                  <td className="px-3 py-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline break-all"
                    >
                      Open
                    </a>
                  </td>
                  <td className="px-3 py-2">{item.isActive === false ? 'No' : 'Yes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
