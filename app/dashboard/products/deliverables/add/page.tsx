'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

function AddDeliverableForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const currentUser = getCurrentUser()
  const [productName, setProductName] = useState('')
  const [deliverableName, setDeliverableName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin')) {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard')
      return
    }
    if (!productId) {
      toast.error('Product not specified')
      router.push('/dashboard/products/deliverables')
      return
    }
    loadProduct()
  }, [currentUser, productId, router])

  const loadProduct = async () => {
    try {
      const product = await apiRequest<{ productName: string }>(`/products/${productId}`)
      setProductName(product?.productName || '')
    } catch (err: any) {
      toast.error('Failed to load product')
      router.push('/dashboard/products/deliverables')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return

    const trimmed = deliverableName.trim()
    if (!trimmed) {
      toast.error('Deliverable name is required')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/deliverables', {
        method: 'POST',
        body: JSON.stringify({ deliverableName: trimmed, productId }),
      })
      toast.success('Deliverable saved successfully!')
      router.push('/dashboard/products/deliverables')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save deliverable')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/products/deliverables')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/products/deliverables"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Product Deliverables
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Add Deliverable</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Add a deliverable for product: <span className="font-medium text-neutral-900">{productName}</span>
        </p>
      </div>

      <Card className="p-4 md:p-6 max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="deliverableName">Deliverable Name *</Label>
            <Input
              id="deliverableName"
              value={deliverableName}
              onChange={(e) => setDeliverableName(e.target.value)}
              placeholder="Enter deliverable name"
              required
              className="mt-2"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function AddDeliverablePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Loading...</div>}>
      <AddDeliverableForm />
    </Suspense>
  )
}
