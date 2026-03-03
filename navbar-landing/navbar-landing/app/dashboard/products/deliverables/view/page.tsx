'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { ArrowLeft, FileText } from 'lucide-react'

type Deliverable = {
  _id: string
  deliverableName: string
  product?: { productName: string }
}

function ViewDeliverablesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const currentUser = getCurrentUser()
  const [productName, setProductName] = useState('')
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
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
    loadData()
  }, [currentUser, productId, router])

  const loadData = async () => {
    try {
      const [product, items] = await Promise.all([
        apiRequest<{ productName: string }>(`/products/${productId}`),
        apiRequest<Deliverable[]>(`/deliverables/by-product/${productId}`),
      ])
      setProductName(product?.productName || '')
      setDeliverables(items || [])
    } catch (err: any) {
      toast.error('Failed to load deliverables')
      router.push('/dashboard/products/deliverables')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">View Deliverables</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Deliverables for product: <span className="font-medium text-neutral-900">{productName}</span>
        </p>
      </div>

      <Card className="p-4 md:p-6">
        {deliverables.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p>No deliverables mapped to this product yet.</p>
            <Link href={`/dashboard/products/deliverables/add?productId=${productId}`}>
              <span className="text-blue-600 hover:underline mt-2 inline-block">Add deliverable</span>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {deliverables.map((d) => (
              <li key={d._id} className="py-3 px-2 text-neutral-800">
                {d.deliverableName}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default function ViewDeliverablesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Loading...</div>}>
      <ViewDeliverablesContent />
    </Suspense>
  )
}
