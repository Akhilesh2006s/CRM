/**
 * Match DC product rows to warehouse inventory SKUs.
 *
 * Inventory identity (from Add Item / Stock) is:
 *   product + productCategory + specs + subject + level
 *
 * DC rows carry extra context (Class 1, New Students, etc.).
 * Student Type / enrollment Category is never Product Category.
 * Class is not part of the Stock identity key.
 *
 * Compatibility:
 * - Product name must match.
 * - If BOTH the inventory record and the DC row have a value for a field,
 *   those values must match (L1 stock is never used for L2).
 * - Empty / "-" inventory fields are wildcards and can fulfill a DC that
 *   has Class/Level/Subject filled in.
 * - DC enrollment categories (New Students, etc.) are not inventory SKU category.
 *
 * Available qty = sum of currentStock on all compatible Stock records
 * (same function as the DC @ Warehouse table). Class is ignored.
 * Validation compares TOTAL required qty for a stock key against that
 * aggregated Stock qty — never a row-wise running remainder.
 */

const STUDENT_ENROLLMENT_CATEGORIES = new Set([
  'new student',
  'new students',
  'existing student',
  'existing students',
  'old student',
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
  const s = blank(value);
  if (!s || s.toLowerCase() === 'regular') return '';
  return s.toLowerCase();
}

function isStudentCategory(value) {
  const n = normName(value).replace(/[\s_-]+/g, ' ');
  if (!n) return false;
  if (STUDENT_ENROLLMENT_CATEGORIES.has(n)) return true;
  if (/^(new|old|existing)\s*students?$/.test(n)) return true;
  if (/^(new|existing)\s*school$/.test(n)) return true;
  if (/^training\s*materials?$/.test(n)) return true;
  return false;
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

/** Exact inventory identity: Product + Product Category + Level + Specs + Subject */
function inventoryIdentityKey(item = {}) {
  return [
    normName(item.productName || productNameFromRow(item)),
    normName(skuCategoryFromItem(item) || skuCategoryFromRow(item)),
    normLevel(item.level),
    normSpecs(item.specs),
    normSubject(item.subject),
  ].join('|');
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
  const sku = skuCategoryFromRow(row);
  const level = blank(row.level);
  const specs = blank(row.specs);
  const subject = blank(row.subject);
  const parts = [name];
  if (sku) parts.push(sku);
  if (level) parts.push(level);
  if (specs && specs.toLowerCase() !== 'regular') parts.push(specs);
  if (subject) parts.push(subject);
  return parts.join(' ');
}

function itemId(item) {
  return item && item._id != null ? String(item._id) : '';
}

function stockOf(item) {
  return Number(item?.currentStock) || 0;
}

function stockFieldCovers(stockValue, dcValue, normalize) {
  const stockNorm = normalize(stockValue);
  const dcNorm = normalize(dcValue);
  if (!stockNorm || !dcNorm) return true;
  return stockNorm === dcNorm;
}

function itemCompatibleWithRow(item, row) {
  if (!item || !row) return false;
  if (normName(item.productName) !== normName(productNameFromRow(row))) return false;

  const stockCat = normName(skuCategoryFromItem(item));
  const dcCat = normName(skuCategoryFromRow(row));
  if (stockCat && dcCat && stockCat !== dcCat) return false;

  if (!stockFieldCovers(item.level, row.level, normLevel)) return false;
  if (!stockFieldCovers(item.specs, row.specs, normSpecs)) return false;
  if (!stockFieldCovers(item.subject, row.subject, normSubject)) return false;
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
  if (normSubject(item.subject) && normSubject(item.subject) === normSubject(row.subject)) score += 1;
  if (normSpecs(item.specs) && normSpecs(item.specs) === normSpecs(row.specs)) score += 1;
  const rowSku = skuCategoryFromRow(row);
  const itemSku = skuCategoryFromItem(item);
  if (rowSku && itemSku && normName(rowSku) === normName(itemSku)) score += 1;
  return score;
}

function preferredCompatibleItems(inventoryItems, row) {
  const compatible = compatibleInventoryItems(inventoryItems, row);
  if (compatible.length <= 1) return compatible;

  const groups = new Map();
  for (const item of compatible) {
    const key = inventoryIdentityKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let bestScore = -1;
  let bestGroups = [];
  for (const items of groups.values()) {
    const score = Math.max(...items.map((item) => specificityScore(item, row)));
    if (score > bestScore) {
      bestScore = score;
      bestGroups = [items];
    } else if (score === bestScore) {
      bestGroups.push(items);
    }
  }

  if (bestGroups.length <= 1) return bestGroups[0] || [];

  return bestGroups.sort((a, b) => {
    const sa = a.reduce((sum, item) => sum + stockOf(item), 0);
    const sb = b.reduce((sum, item) => sum + stockOf(item), 0);
    return sb - sa;
  })[0];
}

function availableStockForRow(inventoryItems, row, remainingById) {
  const compatible = compatibleInventoryItems(inventoryItems, row);
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

/** Available Qty comes from the matching Stock record. Class/Vendor are ignored. */
function mapInventoryIdentityOntoDcRow(row, inventoryItems) {
  const productCategory = skuCategoryFromRow(row);
  const level = blank(row.level);
  const specs = blank(row.specs);
  const subject = blank(row.subject);
  const matched = compatibleInventoryItems(inventoryItems, row);
  return {
    productCategory,
    level,
    specs,
    subject,
    availableQuantity: availableStockForRow(inventoryItems, row),
    hasInventoryMatch: matched.length > 0,
  };
}

function formatInsufficientStockMessage(insufficient) {
  const entries = insufficient || [];
  const lines = entries.map((entry) => {
    const body = entry.message || `Required ${entry.requiredQty}, Available ${entry.availableQty}`;
    if (entries.length === 1) return body;
    const label = entry.label || 'Product';
    return `${label}: ${body}`;
  });
  if (lines.length === 0) {
    return 'Insufficient stock. Please ensure sufficient stock before processing this DC.';
  }
  return `Insufficient stock: ${lines.join('; ')}`;
}

function displayedAvailableQty(row) {
  if (!row || row.availableQuantity === undefined || row.availableQuantity === null || row.availableQuantity === '') {
    return null;
  }
  const n = Number(row.availableQuantity);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, n);
}

/** Pool key for the table Available Qty. Class/Vendor/qty columns are ignored. */
function displayedStockPoolKey(row = {}) {
  return [
    normName(productNameFromRow(row)),
    normName(skuCategoryFromRow(row)),
    normLevel(row.level),
    normSpecs(row.specs),
    normSubject(row.subject),
  ].join('|');
}

function stockAvailableForRow(inventoryItems, row) {
  const computedQty = availableStockForRow(inventoryItems, row);
  const displayedQty = displayedAvailableQty(row);
  if (computedQty > 0) return computedQty;
  if (displayedQty != null) return displayedQty;
  return computedQty;
}

function validateDcStockAgainstInventory(rows, inventoryItems) {
  const remainingById = new Map();
  for (const item of Array.isArray(inventoryItems) ? inventoryItems : []) {
    const id = itemId(item);
    if (id) remainingById.set(id, stockOf(item));
  }

  const groups = new Map();
  const activeRows = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const requiredQty = requiredQtyFromDcRow(row);
    if (requiredQty <= 0) continue;
    activeRows.push(row);

    const poolKey = displayedStockPoolKey(row);
    const availableQty = stockAvailableForRow(inventoryItems, row);
    if (!groups.has(poolKey)) {
      groups.set(poolKey, {
        label: rowStockLabel(row),
        requiredQty: 0,
        availableQty,
      });
    }
    groups.get(poolKey).requiredQty += requiredQty;
  }

  const insufficient = [];
  for (const group of groups.values()) {
    if (group.requiredQty > group.availableQty) {
      insufficient.push({
        label: group.label,
        requiredQty: group.requiredQty,
        availableQty: group.availableQty,
        message: `Required ${group.requiredQty}, Available ${group.availableQty}`,
      });
    }
  }

  if (insufficient.length > 0) {
    return {
      ok: false,
      message: formatInsufficientStockMessage(insufficient),
      insufficient,
      allocations: [],
    };
  }

  const allocations = [];
  for (const row of activeRows) {
    const requiredQty = requiredQtyFromDcRow(row);
    const compatible = compatibleInventoryItems(inventoryItems, row);
    const availableQty = stockAvailableForRow(inventoryItems, row);
    const splits = allocateSplits(compatible, requiredQty, remainingById);
    allocations.push({
      row,
      item: splits[0]?.item || compatible[0] || null,
      requiredQty,
      availableQty,
      splits,
    });
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
  skuCategoryFromItem,
  inventoryIdentityKey,
  requiredQtyFromDcRow,
  rowStockLabel,
  itemCompatibleWithRow,
  compatibleInventoryItems,
  preferredCompatibleItems,
  availableStockForRow,
  displayedAvailableQty,
  displayedStockPoolKey,
  itemMatchesRow,
  matchWarehouseItem,
  mapInventoryIdentityOntoDcRow,
  formatInsufficientStockMessage,
  validateDcStockAgainstInventory,
};
