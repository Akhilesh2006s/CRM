'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { Package, PlusCircle, Eye, RefreshCw } from 'lucide-react'

type Product = {
  _id: string
  productName: string
}

export default function DeliverablesPage() {
  const router = useRouter()
  const currentUser = getCurrentUser()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin'

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<Product[]>('/products')
      setProducts(Array.isArray(data) ? data : [])
    } catch (err: any) {
      const msg = err?.message || 'Failed to load products'
      setError(msg)
      toast.error(msg)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser && !isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard')
      return
    }
    // Load products when admin, or when user unknown (RequireAuth passed = has token; backend will enforce role)
    loadProducts()
  }, [currentUser, isAdmin, router, loadProducts])

  if (currentUser && !isAdmin) {
    return null
  }

  if (loading && products.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center text-neutral-500">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Product Deliverables</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Map deliverables to each product. Add or view deliverables per product.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={loadProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 md:p-6">
        {products.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p>{error ? 'Could not load products.' : 'No products found. Add products first.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Product Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium">{product.productName}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/products/deliverables/add?productId=${product._id}`}>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Deliverable for Product
                          </Button>
                        </Link>
                        <Link href={`/dashboard/products/deliverables/view?productId=${product._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Deliverables
                          </Button>
                        </Link>
                      </div>
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
