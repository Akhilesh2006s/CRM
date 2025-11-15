'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { useProducts } from '@/hooks/useProducts'

export default function InventoryNewItemPage() {
  const router = useRouter()
  const { productNames: productOptions, getProductLevels, getProductSpecs, getProductSubjects, hasProductSubjects } = useProducts()
  const [productName, setProductName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [specs, setSpecs] = useState<string>('Regular')
  const [subject, setSubject] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [saving, setSaving] = useState(false)
  
  // Update level, specs, and subject options when product changes
  useEffect(() => {
    if (productName) {
      const levels = getProductLevels(productName)
      if (levels.length > 0 && !levels.includes(level)) {
        setLevel(levels[0]) // Set to first available level
      }
      const availableSpecs = getProductSpecs(productName)
      if (availableSpecs.length > 0 && !availableSpecs.includes(specs)) {
        setSpecs(availableSpecs[0]) // Set to first available spec
      }
      if (!hasProductSubjects(productName)) {
        setSubject('') // Clear subject if product doesn't have subjects
      }
    }
  }, [productName, getProductLevels, getProductSpecs, hasProductSubjects])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const qty = parseFloat(quantity) || 0
      await apiRequest('/warehouse', {
        method: 'POST',
        body: JSON.stringify({ 
          productName, 
          category, 
          level,
          specs: specs || 'Regular',
          subject: subject || undefined,
          currentStock: qty 
        }),
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
              const availableLevels = getProductLevels(value)
              setLevel(availableLevels.length > 0 ? availableLevels[0] : '')
              // Reset specs and set to first available spec
              const availableSpecs = getProductSpecs(value)
              setSpecs(availableSpecs.length > 0 ? availableSpecs[0] : 'Regular')
              // Clear subject if product doesn't have subjects
              if (!hasProductSubjects(value)) {
                setSubject('')
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
                {productName && getProductLevels(productName).map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Specs</div>
            <Select onValueChange={setSpecs} value={specs} disabled={!productName}>
              <SelectTrigger>
                <SelectValue placeholder={productName ? "Select Specs" : "Select Product first"} />
              </SelectTrigger>
              <SelectContent>
                {productName && getProductSpecs(productName).map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productName && hasProductSubjects(productName) && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Subject</div>
              <Select onValueChange={setSubject} value={subject || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {getProductSubjects(productName).map((subj) => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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



