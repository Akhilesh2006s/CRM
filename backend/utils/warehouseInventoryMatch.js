/**
 * Match DC product rows to warehouse inventory SKUs.
 *
 * Inventory identity (from Add Item / Stock) is:
 *   product + class + category + level + specs + subject + itemType + vendor
 *
 * DC rows carry extra context (Class 1, New Students, L1, subject, etc.).
 * Those DC-only fields must not hide stock whose inventory value is empty ("-").
 *
 * Compatibility:
 * - Product name must match.
 * - If BOTH the inventory record and the DC row have a value for a field,
 *   those values must match (L1 stock is never used for L2).
 * - Empty / "-" inventory fields are wildcards and can fulfill a DC that
 *   has Class/Level/Subject/Item Type filled in.
 * - DC enrollment categories (New Students, etc.) are not inventory SKU category.
 *
 * Available qty = sum of currentStock on all compatible inventory records,
 * minus quantity already reserved by earlier lines on this DC.
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
]);

function blank(value) {
  const s = String(value ?? '').trim();
  const lower = s.toLowerCase();
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
    return '';
  }
  return s;
}

function normName(value) {
  return blank(value).toLowerCase();
}

function normSubject(value) {
  return blank(value).toLowerCase();
}

/** Level 1 / L1 / l1 → l1; empty stays empty so L1 stock is never Level 2. */
function normLevel(value) {
  const s = blank(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (!s) return '';
  const m = s.match(/^(?:level|lvl|l)?(\d+)$/);
  if (m) return `l${m[1]}`;
  return s;
}

function normClass(value) {
  const s = blank(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (!s) return '';
  const m = s.match(/^(?:class|cls|c)?(\d+)$/);
  if (m) return m[1];
  return s;
}

function normSpecs(value) {
  return (blank(value) || 'Regular').toLowerCase();
}

function isDefaultSpecs(value) {
  const raw = blank(value);
  return !raw || raw.toLowerCase() === 'regular';
}

/** DC Regular/empty is the default spec and must not hide custom inventory specs. Specific DC specs still must match. */
function specsConflict(itemSpecs, rowSpecs) {
  if (isDefaultSpecs(rowSpecs)) return false;
  if (isDefaultSpecs(itemSpecs)) return true;
  return normSpecs(itemSpecs) !== normSpecs(rowSpecs);
}

function isStudentCategory(value) {
  return STUDENT_ENROLLMENT_CATEGORIES.has(normName(value));
}

/** Inventory SKU category from a DC row (workbook, etc.). Never use DC enrollment Category or Specs. */
function skuCategoryFromRow(row = {}) {
  const productCategory = blank(row.productCategory);
  if (productCategory && !isStudentCategory(productCategory)) return productCategory;
  const category = blank(row.category);
  if (category && !isStudentCategory(category)) return category;
  return '';
}

function skuCategoryFromItem(item = {}) {
  const category = blank(item.category);
  if (category && !isStudentCategory(category)) return category;
  return '';
}

function productNameFromRow(row = {}) {
  return blank(row.productName || row.product || row.product_name);
}

function requiredQtyFromDcRow(row = {}) {
  const q = Number(row.quantity);
  if (Number.isFinite(q) && q > 0) return q;
  const s = Number(row.strength);
  if (Number.isFinite(s) && s > 0) return s;
  return 0;
}

function rowStockLabel(row = {}) {
  const name = productNameFromRow(row) || 'Product';
  const subject = blank(row.subject);
  const level = blank(row.level);
  const klass = blank(row.class);
  const parts = [name];
  if (subject) parts.push(subject);
  if (level) parts.push(level);
  if (klass) parts.push(`Class ${klass}`);
  return parts.join(' ');
}

function itemId(item) {
  return item && item._id != null ? String(item._id) : '';
}

function stockOf(item) {
  return Number(item?.currentStock) || 0;
}

/** True when both sides have a value and those values differ. Empty is not a conflict. */
function valuesConflict(itemValue, rowValue, normalize) {
  const itemNorm = normalize(itemValue);
  const rowNorm = normalize(rowValue);
  if (!itemNorm || !rowNorm) return false;
  return itemNorm !== rowNorm;
}

function itemCompatibleWithRow(item, row) {
  if (!item || !row) return false;
  if (normName(item.productName) !== normName(productNameFromRow(row))) return false;
  if (specsConflict(item.specs, row.specs)) return false;
  if (valuesConflict(item.level, row.level, normLevel)) return false;
  if (valuesConflict(item.subject, row.subject, normSubject)) return false;
  if (valuesConflict(item.class, row.class, normClass)) return false;
  if (valuesConflict(item.itemType, row.itemType, normName)) return false;
  if (valuesConflict(item.supplier || item.vendor, row.supplier || row.vendor, normName)) return false;

  const rowSku = skuCategoryFromRow(row);
  const itemSku = skuCategoryFromItem(item);
  if (rowSku && itemSku && normName(rowSku) !== normName(itemSku)) return false;

  return true;
}

function compatibleInventoryItems(inventoryItems, row) {
  return (Array.isArray(inventoryItems) ? inventoryItems : []).filter((item) =>
    itemCompatibleWithRow(item, row)
  );
}

function specificityScore(item, row) {
  let score = 0;
  if (normLevel(item.level) && normLevel(item.level) === normLevel(row.level)) score += 1;
  if (normClass(item.class) && normClass(item.class) === normClass(row.class)) score += 1;
  if (normSubject(item.subject) && normSubject(item.subject) === normSubject(row.subject)) score += 1;
  if (normSpecs(item.specs) && normSpecs(item.specs) === normSpecs(row.specs)) score += 1;
  if (normName(item.itemType) && normName(row.itemType) && normName(item.itemType) === normName(row.itemType)) {
    score += 1;
  }
  const rowSku = skuCategoryFromRow(row);
  const itemSku = skuCategoryFromItem(item);
  if (rowSku && itemSku && normName(rowSku) === normName(itemSku)) score += 1;
  return score;
}

function preferredCompatibleItems(inventoryItems, row) {
  const compatible = compatibleInventoryItems(inventoryItems, row);
  if (compatible.length <= 1) return compatible;
  let best = -1;
  const scored = compatible.map((item) => {
    const score = specificityScore(item, row);
    if (score > best) best = score;
    return { item, score };
  });
  return scored.filter((entry) => entry.score === best).map((entry) => entry.item);
}

function availableStockForRow(inventoryItems, row, remainingById) {
  const compatible = preferredCompatibleItems(inventoryItems, row);
  return compatible.reduce((sum, item) => {
    const id = itemId(item);
    const live = remainingById && id && remainingById.has(id)
      ? remainingById.get(id)
      : stockOf(item);
    return sum + Math.max(0, live);
  }, 0);
}

function allocateSplits(compatible, requiredQty, remainingById) {
  const ranked = [...compatible].sort((a, b) => {
    const sa = remainingById?.get(itemId(a));
    const sb = remainingById?.get(itemId(b));
    const aStock = sa == null ? stockOf(a) : sa;
    const bStock = sb == null ? stockOf(b) : sb;
    if (bStock !== aStock) return bStock - aStock;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

  let left = requiredQty;
  const splits = [];
  for (const item of ranked) {
    if (left <= 0) break;
    const id = itemId(item);
    const have = remainingById && id && remainingById.has(id)
      ? remainingById.get(id)
      : stockOf(item);
    const take = Math.min(Math.max(0, have), left);
    if (take <= 0) continue;
    splits.push({ item, qty: take });
    if (remainingById && id) remainingById.set(id, have - take);
    left -= take;
  }
  return splits;
}

function itemMatchesRow(item, row) {
  return itemCompatibleWithRow(item, row);
}

function matchWarehouseItem(inventoryItems, row) {
  const compatible = preferredCompatibleItems(inventoryItems, row);
  if (compatible.length === 0) return null;
  return [...compatible].sort((a, b) => stockOf(b) - stockOf(a))[0];
}

function formatInsufficientStockMessage(insufficient) {
  const lines = (insufficient || []).map((entry) => {
    const label = entry.label || 'Product';
    return `${label} requires ${entry.requiredQty} but only ${entry.availableQty} is available`;
  });
  if (lines.length === 0) {
    return 'Insufficient stock. Please ensure sufficient stock before processing this DC.';
  }
  if (lines.length === 1) {
    return `Insufficient stock: ${lines[0]}. Please ensure sufficient stock before processing this DC.`;
  }
  return `Insufficient stock: ${lines.join('; ')}. Please ensure sufficient stock before processing this DC.`;
}

function validateDcStockAgainstInventory(rows, inventoryItems) {
  const insufficient = [];
  const allocations = [];
  const remainingById = new Map();
  for (const item of Array.isArray(inventoryItems) ? inventoryItems : []) {
    const id = itemId(item);
    if (id) remainingById.set(id, stockOf(item));
  }

  for (const row of Array.isArray(rows) ? rows : []) {
    const requiredQty = requiredQtyFromDcRow(row);
    if (requiredQty <= 0) continue;

    const compatible = preferredCompatibleItems(inventoryItems, row);
    const availableQty = availableStockForRow(inventoryItems, row, remainingById);

    if (compatible.length === 0 || requiredQty > availableQty) {
      insufficient.push({
        label: rowStockLabel(row),
        requiredQty,
        availableQty,
      });
      continue;
    }

    const splits = allocateSplits(compatible, requiredQty, remainingById);
    allocations.push({
      row,
      item: splits[0]?.item || compatible[0],
      requiredQty,
      availableQty,
      splits,
    });
  }

  if (insufficient.length > 0) {
    return {
      ok: false,
      message: formatInsufficientStockMessage(insufficient),
      insufficient,
      allocations: [],
    };
  }

  return { ok: true, message: '', insufficient: [], allocations };
}

module.exports = {
  blank,
  normName,
  normSubject,
  normLevel,
  normSpecs,
  skuCategoryFromRow,
  requiredQtyFromDcRow,
  rowStockLabel,
  itemCompatibleWithRow,
  compatibleInventoryItems,
  preferredCompatibleItems,
  availableStockForRow,
  itemMatchesRow,
  matchWarehouseItem,
  formatInsufficientStockMessage,
  validateDcStockAgainstInventory,
};
