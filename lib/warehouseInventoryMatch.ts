/**
 * Match DC product rows to warehouse inventory SKUs.
 * Same identity rules as backend/utils/warehouseInventoryMatch.js.
 */

const STUDENT_ENROLLMENT_CATEGORIES = new Set([
  'new students',
  'existing students',
  'old students',
  'both',
  'new school',
  'existing school',
  'shortage',
  'training-material',
  'training material',
])

function blank(value: unknown): string {
  const s = String(value ?? '').trim()
  if (!s || s === '-' || s === 'n/a' || s === 'na' || s === 'undefined' || s === 'null') {
    return ''
  }
  return s
}

function normName(value: unknown): string {
  return blank(value).toLowerCase()
}

function normSubject(value: unknown): string {
  return blank(value).toLowerCase()
}

function normLevel(value: unknown): string {
  const s = blank(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
  if (!s) return ''
  const m = s.match(/^(?:level|lvl|l)?(\d+)$/)
  if (m) return `l${m[1]}`
  return s
}

function normSpecs(value: unknown): string {
  return (blank(value) || 'Regular').toLowerCase()
}

function isStudentCategory(value: unknown): boolean {
  return STUDENT_ENROLLMENT_CATEGORIES.has(normName(value))
}

export function skuCategoryFromRow(row: Record<string, any> = {}): string {
  const productCategory = blank(row.productCategory)
  if (productCategory && !isStudentCategory(productCategory)) return productCategory
  const specs = blank(row.specs)
  if (specs && specs.toLowerCase() !== 'regular' && !isStudentCategory(specs)) return specs
  const category = blank(row.category)
  if (category && !isStudentCategory(category)) return category
  return ''
}

function skuCategoryFromItem(item: Record<string, any> = {}): string {
  const category = blank(item.category)
  if (category && !isStudentCategory(category)) return category
  return ''
}

export function productNameFromRow(row: Record<string, any> = {}): string {
  return blank(row.productName || row.product || row.product_name)
}

export function requiredQtyFromDcRow(row: Record<string, any> = {}): number {
  const q = Number(row.quantity)
  if (Number.isFinite(q) && q > 0) return q
  const s = Number(row.strength)
  if (Number.isFinite(s) && s > 0) return s
  return 0
}

export function rowStockLabel(row: Record<string, any> = {}): string {
  const name = productNameFromRow(row) || 'Product'
  const subject = blank(row.subject)
  const level = blank(row.level)
  const klass = blank(row.class)
  const parts = [name]
  if (subject) parts.push(subject)
  if (level) parts.push(level)
  if (klass) parts.push(`Class ${klass}`)
  return parts.join(' ')
}

export function itemMatchesRow(item: Record<string, any>, row: Record<string, any>): boolean {
  if (!item || !row) return false
  if (normName(item.productName) !== normName(productNameFromRow(row))) return false
  if (normSubject(item.subject) !== normSubject(row.subject)) return false
  if (normLevel(item.level) !== normLevel(row.level)) return false
  if (normSpecs(item.specs) !== normSpecs(row.specs)) return false

  const rowSku = skuCategoryFromRow(row)
  const itemSku = skuCategoryFromItem(item)
  if (rowSku && itemSku && normName(rowSku) !== normName(itemSku)) return false

  const rowClass = blank(row.class)
  const itemClass = blank(item.class)
  if (rowClass && itemClass && normName(rowClass) !== normName(itemClass)) return false

  return true
}

export function matchWarehouseItem<T extends Record<string, any>>(
  inventoryItems: T[] | undefined,
  row: Record<string, any>
): T | null {
  const items = Array.isArray(inventoryItems) ? inventoryItems : []
  return items.find((item) => itemMatchesRow(item, row)) || null
}

function inventoryItemId(item: Record<string, any> | null): string {
  if (!item) return ''
  if (item._id) return String(item._id)
  return [
    normName(item.productName),
    normSubject(item.subject),
    normLevel(item.level),
    normSpecs(item.specs),
    normName(skuCategoryFromItem(item)),
  ].join('|')
}

export function formatInsufficientStockMessage(
  insufficient: Array<{ label: string; requiredQty: number; availableQty: number }>
): string {
  const lines = (insufficient || []).map((entry) => {
    const label = entry.label || 'Product'
    return `${label} requires ${entry.requiredQty} but only ${entry.availableQty} is available`
  })
  if (lines.length === 0) {
    return 'Insufficient stock. Please ensure sufficient stock before processing this DC.'
  }
  if (lines.length === 1) {
    return `Insufficient stock: ${lines[0]}. Please ensure sufficient stock before processing this DC.`
  }
  return `Insufficient stock: ${lines.join('; ')}. Please ensure sufficient stock before processing this DC.`
}

export function validateDcStockAgainstInventory(
  rows: Record<string, any>[] | undefined,
  inventoryItems: Record<string, any>[] | undefined
): {
  ok: boolean
  message: string
  insufficient: Array<{ label: string; requiredQty: number; availableQty: number }>
  allocations: Array<{ row: Record<string, any>; item: Record<string, any> | null; requiredQty: number; availableQty: number }>
} {
  const insufficient: Array<{ label: string; requiredQty: number; availableQty: number }> = []
  const allocations: Array<{
    row: Record<string, any>
    item: Record<string, any> | null
    requiredQty: number
    availableQty: number
  }> = []
  const reserved = new Map<string, number>()

  for (const row of Array.isArray(rows) ? rows : []) {
    const requiredQty = requiredQtyFromDcRow(row)
    if (requiredQty <= 0) continue

    const item = matchWarehouseItem(inventoryItems, row)
    const stock = item ? Number(item.currentStock) || 0 : 0
    const key = item ? inventoryItemId(item) : `__unmatched__:${rowStockLabel(row)}`
    const already = reserved.get(key) || 0
    const availableQty = Math.max(0, stock - already)

    if (requiredQty > availableQty) {
      insufficient.push({
        label: rowStockLabel(row),
        requiredQty,
        availableQty,
      })
      continue
    }

    reserved.set(key, already + requiredQty)
    allocations.push({ row, item, requiredQty, availableQty: stock })
  }

  if (insufficient.length > 0) {
    return {
      ok: false,
      message: formatInsufficientStockMessage(insufficient),
      insufficient,
      allocations: [],
    }
  }

  return { ok: true, message: '', insufficient: [], allocations }
}
