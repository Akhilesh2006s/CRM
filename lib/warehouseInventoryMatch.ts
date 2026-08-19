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
  const lower = s.toLowerCase()
  if (
    !s ||
    lower === '-' ||
    lower === '--' ||
    s === '—' ||
    s === '–' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'undefined' ||
    lower === 'null'
  ) {
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

function isDefaultSpecs(value: unknown): boolean {
  const raw = blank(value)
  return !raw || raw.toLowerCase() === 'regular'
}

function specsConflict(itemSpecs: unknown, rowSpecs: unknown): boolean {
  if (isDefaultSpecs(rowSpecs)) return false
  if (isDefaultSpecs(itemSpecs)) return true
  return normSpecs(itemSpecs) !== normSpecs(rowSpecs)
}

function normClass(value: unknown): string {
  const s = blank(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
  if (!s) return ''
  const m = s.match(/^(?:class|cls|c)?(\d+)$/)
  if (m) return m[1]
  return s
}

function isStudentCategory(value: unknown): boolean {
  return STUDENT_ENROLLMENT_CATEGORIES.has(normName(value))
}

export function skuCategoryFromRow(row: Record<string, any> = {}): string {
  const productCategory = blank(row.productCategory)
  if (productCategory && !isStudentCategory(productCategory)) return productCategory
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

function itemId(item: Record<string, any> | null | undefined): string {
  return item && item._id != null ? String(item._id) : ''
}

function stockOf(item: Record<string, any> | null | undefined): number {
  return Number(item?.currentStock) || 0
}

function valuesConflict(
  itemValue: unknown,
  rowValue: unknown,
  normalize: (value: unknown) => string
): boolean {
  const itemNorm = normalize(itemValue)
  const rowNorm = normalize(rowValue)
  if (!itemNorm || !rowNorm) return false
  return itemNorm !== rowNorm
}

export function itemCompatibleWithRow(item: Record<string, any>, row: Record<string, any>): boolean {
  if (!item || !row) return false
  if (normName(item.productName) !== normName(productNameFromRow(row))) return false
  if (specsConflict(item.specs, row.specs)) return false
  if (valuesConflict(item.level, row.level, normLevel)) return false
  if (valuesConflict(item.subject, row.subject, normSubject)) return false
  if (valuesConflict(item.class, row.class, normClass)) return false
  if (valuesConflict(item.itemType, row.itemType, normName)) return false
  if (valuesConflict(item.supplier || item.vendor, row.supplier || row.vendor, normName)) return false

  const rowSku = skuCategoryFromRow(row)
  const itemSku = skuCategoryFromItem(item)
  if (rowSku && itemSku && normName(rowSku) !== normName(itemSku)) return false

  return true
}

export function compatibleInventoryItems<T extends Record<string, any>>(
  inventoryItems: T[] | undefined,
  row: Record<string, any>
): T[] {
  return (Array.isArray(inventoryItems) ? inventoryItems : []).filter((item) =>
    itemCompatibleWithRow(item, row)
  )
}

function specificityScore(item: Record<string, any>, row: Record<string, any>): number {
  let score = 0
  if (normLevel(item.level) && normLevel(item.level) === normLevel(row.level)) score += 1
  if (normClass(item.class) && normClass(item.class) === normClass(row.class)) score += 1
  if (normSubject(item.subject) && normSubject(item.subject) === normSubject(row.subject)) score += 1
  if (normSpecs(item.specs) && normSpecs(item.specs) === normSpecs(row.specs)) score += 1
  if (normName(item.itemType) && normName(row.itemType) && normName(item.itemType) === normName(row.itemType)) {
    score += 1
  }
  const rowSku = skuCategoryFromRow(row)
  const itemSku = skuCategoryFromItem(item)
  if (rowSku && itemSku && normName(rowSku) === normName(itemSku)) score += 1
  return score
}

export function preferredCompatibleItems<T extends Record<string, any>>(
  inventoryItems: T[] | undefined,
  row: Record<string, any>
): T[] {
  const compatible = compatibleInventoryItems(inventoryItems, row)
  if (compatible.length <= 1) return compatible
  let best = -1
  const scored = compatible.map((item) => {
    const score = specificityScore(item, row)
    if (score > best) best = score
    return { item, score }
  })
  return scored.filter((entry) => entry.score === best).map((entry) => entry.item)
}

export function availableStockForRow(
  inventoryItems: Record<string, any>[] | undefined,
  row: Record<string, any>,
  remainingById?: Map<string, number>
): number {
  const compatible = preferredCompatibleItems(inventoryItems, row)
  return compatible.reduce((sum, item) => {
    const id = itemId(item)
    const live =
      remainingById && id && remainingById.has(id) ? remainingById.get(id)! : stockOf(item)
    return sum + Math.max(0, live)
  }, 0)
}

export function itemMatchesRow(item: Record<string, any>, row: Record<string, any>): boolean {
  return itemCompatibleWithRow(item, row)
}

export function matchWarehouseItem<T extends Record<string, any>>(
  inventoryItems: T[] | undefined,
  row: Record<string, any>
): T | null {
  const compatible = preferredCompatibleItems(inventoryItems, row)
  if (compatible.length === 0) return null
  return [...compatible].sort((a, b) => stockOf(b) - stockOf(a))[0]
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
  allocations: Array<{
    row: Record<string, any>
    item: Record<string, any> | null
    requiredQty: number
    availableQty: number
    splits?: Array<{ item: Record<string, any>; qty: number }>
  }>
} {
  const insufficient: Array<{ label: string; requiredQty: number; availableQty: number }> = []
  const allocations: Array<{
    row: Record<string, any>
    item: Record<string, any> | null
    requiredQty: number
    availableQty: number
    splits?: Array<{ item: Record<string, any>; qty: number }>
  }> = []
  const remainingById = new Map<string, number>()
  for (const item of Array.isArray(inventoryItems) ? inventoryItems : []) {
    const id = itemId(item)
    if (id) remainingById.set(id, stockOf(item))
  }

  for (const row of Array.isArray(rows) ? rows : []) {
    const requiredQty = requiredQtyFromDcRow(row)
    if (requiredQty <= 0) continue

    const compatible = preferredCompatibleItems(inventoryItems, row)
    const availableQty = availableStockForRow(inventoryItems, row, remainingById)

    if (compatible.length === 0 || requiredQty > availableQty) {
      insufficient.push({
        label: rowStockLabel(row),
        requiredQty,
        availableQty,
      })
      continue
    }

    const ranked = [...compatible].sort((a, b) => {
      const aStock = remainingById.get(itemId(a)) ?? stockOf(a)
      const bStock = remainingById.get(itemId(b)) ?? stockOf(b)
      if (bStock !== aStock) return bStock - aStock
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    })
    let left = requiredQty
    const splits: Array<{ item: Record<string, any>; qty: number }> = []
    for (const item of ranked) {
      if (left <= 0) break
      const id = itemId(item)
      const have = remainingById.get(id) ?? stockOf(item)
      const take = Math.min(Math.max(0, have), left)
      if (take <= 0) continue
      splits.push({ item, qty: take })
      if (id) remainingById.set(id, have - take)
      left -= take
    }

    allocations.push({
      row,
      item: splits[0]?.item || compatible[0],
      requiredQty,
      availableQty,
      splits,
    })
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
