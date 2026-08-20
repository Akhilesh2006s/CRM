'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { useProducts } from '@/hooks/useProducts'

type InventoryOptions = { itemTypes?: string[] }
type WarehouseItem = {
  _id: string
  productName: string
  category?: string
  specs?: string
  level?: string
  itemType?: string
  class?: string
  subject?: string
  currentStock?: number
}

function blank(value: unknown): string {
  const s = String(value ?? '').trim()
  if (!s || s === '-' || s === 'n/a' || s === 'na') return ''
  return s
}

function same(a: unknown, b: unknown): boolean {
  return blank(a).toLowerCase() === blank(b).toLowerCase()
}

function uniqueValues(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const v = blank(raw)
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

function itemMatchesFields(
  item: WarehouseItem,
  fields: { productName: string; itemType: string; category: string; specs: string; level: string; subject: string }
) {
  return (
    same(item.productName, fields.productName) &&
    same(item.itemType, fields.itemType) &&
    same(item.category, fields.category) &&
    same(item.specs, fields.specs) &&
    same(item.level, fields.level) &&
    same(item.subject, fields.subject)
  )
}

export default function StockAddPage() {
  const router = useRouter()
  const params = useSearchParams()
  const productId = params?.get('productId') || ''
  const originalItemIdRef = useRef(productId)

  const {
    productNames: catalogProducts,
    getProductLevels,
    getProductSpecs,
    getProductCategories,
    hasProductCategories,
    hasProductLevels,
    hasProductSpecs,
    hasProductSubjects,
    getProductSubjects,
  } = useProducts()

  const [loadingItem, setLoadingItem] = useState(true)
  const [itemMissing, setItemMissing] = useState(false)
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [itemTypes, setItemTypes] = useState<string[]>([])
  const [selectedItemId, setSelectedItemId] = useState(productId)

  const [productName, setProductName] = useState('')
  const [itemType, setItemType] = useState('')
  const [category, setCategory] = useState('')
  const [specs, setSpecs] = useState('')
  const [level, setLevel] = useState('')
  const [subject, setSubject] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)

  function upsertWarehouseItem(item: WarehouseItem) {
    setWarehouseItems((prev) => {
      const idx = prev.findIndex((w) => w._id === item._id)
      if (idx === -1) return [item, ...prev]
      const next = [...prev]
      next[idx] = { ...next[idx], ...item }
      return next
    })
  }

  function applyItem(item: WarehouseItem) {
    setSelectedItemId(item._id)
    setProductName(item.productName || '')
    setItemType(blank(item.itemType))
    setCategory(blank(item.category))
    setSpecs(blank(item.specs))
    setLevel(blank(item.level))
    setSubject(blank(item.subject))
    upsertWarehouseItem(item)
  }

  function resolveExistingItemId(fields: {
    productName: string
    itemType: string
    category: string
    specs: string
    level: string
    subject: string
  }): string {
    const originalId = originalItemIdRef.current
    const original = originalId ? warehouseItems.find((w) => w._id === originalId) : null
    if (original && itemMatchesFields(original, fields)) return original._id

    const matches = warehouseItems.filter((w) => itemMatchesFields(w, fields))
    if (matches.length === 1) return matches[0]._id
    if (selectedItemId && matches.some((w) => w._id === selectedItemId)) return selectedItemId
    return matches[0]?._id || ''
  }

  useEffect(() => {
    originalItemIdRef.current = productId
    ;(async () => {
      try {
        const [opts, list] = await Promise.all([
          apiRequest<InventoryOptions>('/metadata/inventory-options').catch(() => ({})),
          apiRequest<WarehouseItem[]>('/warehouse').catch(() => []),
        ])
        if (opts?.itemTypes?.length) setItemTypes(opts.itemTypes)
        const rows = Array.isArray(list) ? list : []
        setWarehouseItems(rows)

        if (productId) {
          try {
            const item = await apiRequest<WarehouseItem>(`/warehouse/${productId}`)
            applyItem(item)
            setItemMissing(false)
          } catch (err: any) {
            const fromList = rows.find((w) => w._id === productId)
            if (fromList) {
              applyItem(fromList)
              setItemMissing(false)
            } else {
              setItemMissing(true)
              toast.error(err?.message || 'Inventory item not found')
            }
          }
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load inventory')
      } finally {
        setLoadingItem(false)
      }
    })()
  }, [productId])

  const showCategory = Boolean(productName && hasProductCategories(productName))
  const showLevel = Boolean(productName && hasProductLevels(productName))
  const showSpecs = Boolean(productName && hasProductSpecs(productName))
  const showSubject = Boolean(productName && hasProductSubjects(productName))

  const productOptions = useMemo(() => {
    return uniqueValues([...catalogProducts, productName])
  }, [catalogProducts, productName])

  const itemsForProduct = useMemo(() => {
    if (!productName) return []
    return warehouseItems.filter((w) => same(w.productName, productName))
  }, [warehouseItems, productName])

  const itemTypeOptions = useMemo(() => {
    return uniqueValues([...itemTypes, ...itemsForProduct.map((w) => w.itemType), itemType])
  }, [itemTypes, itemsForProduct, itemType])

  const categoryOptions = useMemo(() => {
    if (!showCategory) return []
    return uniqueValues([...(productName ? getProductCategories(productName) : []), category])
  }, [showCategory, productName, getProductCategories, category])

  const specsOptions = useMemo(() => {
    if (!showSpecs) return []
    return uniqueValues([...(productName ? getProductSpecs(productName) : []), specs])
  }, [showSpecs, productName, getProductSpecs, specs])

  const levelOptions = useMemo(() => {
    if (!showLevel) return []
    return uniqueValues([...(productName ? getProductLevels(productName) : []), level])
  }, [showLevel, productName, getProductLevels, level])

  const subjectOptions = useMemo(() => {
    if (!showSubject) return []
    return uniqueValues([...(productName ? getProductSubjects(productName) : []), subject])
  }, [showSubject, productName, getProductSubjects, subject])

  function onProductChange(value: string) {
    setProductName(value)
    setItemType('')
    setCategory('')
    setSpecs('')
    setLevel('')
    setSubject('')
    setSelectedItemId('')
  }

  function onIdentityChange(
    patch: Partial<{ itemType: string; category: string; specs: string; level: string; subject: string }>
  ) {
    const next = {
      productName,
      itemType,
      category,
      specs,
      level,
      subject,
      ...patch,
    }
    if (patch.itemType !== undefined) setItemType(patch.itemType)
    if (patch.category !== undefined) setCategory(patch.category)
    if (patch.specs !== undefined) setSpecs(patch.specs)
    if (patch.level !== undefined) setLevel(patch.level)
    if (patch.subject !== undefined) setSubject(patch.subject)
    const id = resolveExistingItemId(next)
    setSelectedItemId(id)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (itemMissing) {
      toast.error('This inventory item no longer exists')
      return
    }
    if (!productName) {
      toast.error('Product is required')
      return
    }
    if (!itemType) {
      toast.error('Item Type is required')
      return
    }
    if (showCategory && !category) {
      toast.error('Product Category is required for this product')
      return
    }
    if (showLevel && !level) {
      toast.error('Level is required for this product')
      return
    }
    if (showSpecs && !specs) {
      toast.error('Specs is required for this product')
      return
    }
    if (showSubject && !subject) {
      toast.error('Subject is required for this product')
      return
    }

    const amount = Number(qty)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a positive quantity')
      return
    }

    const targetId =
      selectedItemId ||
      resolveExistingItemId({ productName, itemType, category, specs, level, subject })

    if (!targetId) {
      toast.error('No matching inventory item found. Create it from Inventory Items first.')
      return
    }

    try {
      setSaving(true)
      await apiRequest('/warehouse/stock', {
        method: 'POST',
        body: JSON.stringify({
          productId: targetId,
          quantity: amount,
          movementType: 'In',
          reason: 'Manual add',
        }),
      })
      toast.success('Quantity added')
      router.push('/dashboard/warehouse/stock')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add quantity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Add Item Details</h1>
        <p className="text-neutral-500">Add quantity to an existing inventory item</p>
      </div>
      <Card className="p-6">
        {loadingItem ? (
          <div className="text-sm text-neutral-500">Loading item…</div>
        ) : itemMissing ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">This inventory item was not found. It may have been deleted.</p>
            <Button type="button" variant="destructive" onClick={() => router.push('/dashboard/warehouse/stock')}>
              Back to Stock
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Product *</div>
              <Select value={productName || undefined} onValueChange={onProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Item Type *</div>
              <Select
                value={itemType || undefined}
                onValueChange={(v) => onIdentityChange({ itemType: v })}
                disabled={!productName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productName ? 'Select Item Type' : 'Select Product first'} />
                </SelectTrigger>
                <SelectContent>
                  {itemTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showCategory && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Product Category *</div>
              <Select
                value={category || undefined}
                onValueChange={(v) => onIdentityChange({ category: v })}
                disabled={!productName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productName ? 'Select Product Category' : 'Select Product first'} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            {showSpecs && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Specs *</div>
              <Select
                value={specs || undefined}
                onValueChange={(v) => onIdentityChange({ specs: v })}
                disabled={!productName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productName ? 'Select Specs' : 'Select Product first'} />
                </SelectTrigger>
                <SelectContent>
                  {specsOptions.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            {showLevel && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Level *</div>
              <Select
                value={level || undefined}
                onValueChange={(v) => onIdentityChange({ level: v })}
                disabled={!productName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productName ? 'Select Level' : 'Select Product first'} />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            {showSubject && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Subject *</div>
              <Select
                value={subject || undefined}
                onValueChange={(v) => onIdentityChange({ subject: v })}
                disabled={!productName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productName ? 'Select Subject' : 'Select Product first'} />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Quantity *</div>
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="Quantity to add"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving || !productName || !itemType || !qty || (showCategory && !category) || (showLevel && !level) || (showSpecs && !specs) || (showSubject && !subject)}>
                {saving ? 'Adding…' : 'Add Item'}
              </Button>
              <Button type="button" variant="destructive" onClick={() => router.push('/dashboard/warehouse/stock')}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
