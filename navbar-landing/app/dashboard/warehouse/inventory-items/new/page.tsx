'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function InventoryNewItemPage() {
  const router = useRouter()
  const [productName, setProductName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [productOptions, setProductOptions] = useState<string[]>(DEFAULT_PRODUCT_OPTIONS)

  useEffect(() => {
    ;(async () => {
      try {
        const opts = await apiRequest<{ products: string[] }>(
          '/metadata/inventory-options'
        )
        if (opts?.products?.length) setProductOptions(opts.products)
      } catch (_) {}
    })()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const qty = parseFloat(quantity) || 0
      await apiRequest('/warehouse', {
        method: 'POST',
        body: JSON.stringify({ productName, category, level, currentStock: qty }),
      })
      toast.success('Item added')
      router.push('/dashboard/warehouse/inventory-items')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Add Item Details</h1>
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Product *</div>
            <Select onValueChange={(value) => {
              setProductName(value)
              // Reset level and set to first available level for the selected product
              const availableLevels = getAvailableLevels(value)
              setLevel(availableLevels.length > 0 ? availableLevels[0] : '')
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
            <div className="text-sm font-medium">Quantity *</div>
            <Input type="number" step="1" placeholder="Item Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={saving || !productName || !category || !quantity}>
              {saving ? 'Adding…' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}



