'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

const DEFAULT_PRODUCT_OPTIONS = [
  'Abacus',
  'Vedic Maths',
  'EEL',
  'IIT',
  'Financial literacy',
  'Brain bytes',
  'Spelling bee',
  'Skill pro',
  'Maths lab',
  'Codechamp',
]

// Product levels mapping based on the image
const productLevels: Record<string, string[]> = {
  'Abacus': ['L1', 'L2'],
  'Vedic Maths': ['L1', 'L2'],
  'EEL': ['L1'],
  'IIT': ['L1'],
  'Financial literacy': ['L1'],
  'Brain bytes': ['L1'],
  'Spelling bee': ['L1'],
  'Skill pro': ['L1'],
  'Maths lab': ['L1'],
  'Codechamp': ['L1'],
}

// Get available levels for a specific product
const getAvailableLevels = (product: string): string[] => {
  return productLevels[product] || ['L1']
}

type Item = {
  _id: string
  productName: string
  category: string
  level?: string
  unitPrice: number
  currentStock?: number
}

export default function InventoryEditItemPage() {
  const params = useParams<{ id: string }>()
  const id = (params?.id || '').toString()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productOptions, setProductOptions] = useState<string[]>(DEFAULT_PRODUCT_OPTIONS)

  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [updateQty, setUpdateQty] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        // load options
        try {
          const opts = await apiRequest<{ products: string[] }>(
            '/metadata/inventory-options'
          )
          if (opts?.products?.length) setProductOptions(opts.products)
        } catch (_) {}

        const item = await apiRequest<Item>(`/warehouse/${id}`)
        setProductName(item.productName || '')
        setCategory(item.category || '')
        setLevel(item.level || '')
        setUnitPrice(String(item.unitPrice ?? ''))
        setUpdateQty(String(item.currentStock ?? 0))
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load item')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const price = parseFloat(unitPrice)
      const qty = parseFloat(updateQty)
      if (isNaN(qty) || qty < 0) {
        toast.error('Please enter a valid quantity (0 or greater)')
        setSaving(false)
        return
      }
      await apiRequest(`/warehouse/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          productName, 
          category, 
          level, 
          unitPrice: price,
          currentStock: qty 
        }),
      })
      toast.success('Item updated')
      router.push('/dashboard/warehouse/inventory-items')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Edit Item</h1>
      </div>
      <Card className="p-6">
        {!loading && (
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Product *</div>
              <Select onValueChange={(value) => {
                setProductName(value)
                // If level is not valid for new product, reset to first available level
                const availableLevels = getAvailableLevels(value)
                if (!availableLevels.includes(level)) {
                  setLevel(availableLevels.length > 0 ? availableLevels[0] : '')
                }
              }} value={productName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Category *</div>
              <Input placeholder="Category Name" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Level</div>
              <Select onValueChange={setLevel} value={level} disabled={!productName}>
                <SelectTrigger>
                  <SelectValue placeholder={productName ? "Select Level" : "Select Product first"} />
                </SelectTrigger>
                <SelectContent>
                  {productName && getAvailableLevels(productName).map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Price *</div>
              <Input type="number" step="0.01" placeholder="Item Price" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Update qty *</div>
              <Input type="number" step="1" min="0" placeholder="Quantity" value={updateQty} onChange={(e) => setUpdateQty(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={saving || !productName || !category || !unitPrice || !updateQty}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}


