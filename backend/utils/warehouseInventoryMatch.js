/**
 * Match DC product rows to warehouse inventory SKUs.
 * Identity is product + subject + level + specs + (SKU) category.
 * Never fall back to product-name-only (that would let P4 stock cover P1, or Phy cover Math).
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
  if (!s || s === '-' || s === 'n/a' || s === 'na' || s === 'undefined' || s === 'null') {
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

/** Level 1 / L1 / l1 → l1; empty stays empty so L1 stock is never used for L2. */
function normLevel(value) {
  const s = blank(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (!s) return '';
  const m = s.match(/^(?:level|lvl|l)?(\d+)$/);
  if (m) return `l${m[1]}`;
  return s;
}

function normSpecs(value) {
  return (blank(value) || 'Regular').toLowerCase();
}

function isStudentCategory(value) {
  return STUDENT_ENROLLMENT_CATEGORIES.has(normName(value));
}

/** SKU category from a DC row (workbook, etc.) — not New/Existing Students. */
function skuCategoryFromRow(row = {}) {
  const productCategory = blank(row.productCategory);
  if (productCategory && !isStudentCategory(productCategory)) return productCategory;
  const specs = blank(row.specs);
  if (specs && specs.toLowerCase() !== 'regular' && !isStudentCategory(specs)) return specs;
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

function itemMatchesRow(item, row) {
  if (!item || !row) return false;
  if (normName(item.productName) !== normName(productNameFromRow(row))) return false;
  if (normSubject(item.subject) !== normSubject(row.subject)) return false;
  if (normLevel(item.level) !== normLevel(row.level)) return false;
  if (normSpecs(item.specs) !== normSpecs(row.specs)) return false;

  const rowSku = skuCategoryFromRow(row);
  const itemSku = skuCategoryFromItem(item);
  if (rowSku && itemSku && normName(rowSku) !== normName(itemSku)) return false;

  const rowClass = blank(row.class);
  const itemClass = blank(item.class);
  if (rowClass && itemClass && normName(rowClass) !== normName(itemClass)) return false;

  return true;
}

function matchWarehouseItem(inventoryItems, row) {
  const items = Array.isArray(inventoryItems) ? inventoryItems : [];
  return items.find((item) => itemMatchesRow(item, row)) || null;
}

function inventoryItemId(item) {
  if (!item) return '';
  if (item._id) return String(item._id);
  return [
    normName(item.productName),
    normSubject(item.subject),
    normLevel(item.level),
    normSpecs(item.specs),
    normName(skuCategoryFromItem(item)),
  ].join('|');
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

/**
 * Per-row requiredQty <= live currentStock, with cumulative reservation
 * when several DC lines share the same inventory SKU.
 */
function validateDcStockAgainstInventory(rows, inventoryItems) {
  const insufficient = [];
  const allocations = [];
  const reserved = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const requiredQty = requiredQtyFromDcRow(row);
    if (requiredQty <= 0) continue;

    const item = matchWarehouseItem(inventoryItems, row);
    const stock = item ? Number(item.currentStock) || 0 : 0;
    const key = item ? inventoryItemId(item) : `__unmatched__:${rowStockLabel(row)}`;
    const already = reserved.get(key) || 0;
    const availableQty = Math.max(0, stock - already);

    if (requiredQty > availableQty) {
      insufficient.push({
        label: rowStockLabel(row),
        requiredQty,
        availableQty,
      });
      continue;
    }

    reserved.set(key, already + requiredQty);
    allocations.push({ row, item, requiredQty, availableQty: stock });
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
  itemMatchesRow,
  matchWarehouseItem,
  formatInsufficientStockMessage,
  validateDcStockAgainstInventory,
};
