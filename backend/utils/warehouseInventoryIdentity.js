/**
 * Inventory identity for warehouse stock records.
 * Same product name is not enough — class, category, level, specs,
 * subject, and vendor/supplier distinguish variants.
 */

function blank(value) {
  const s = String(value ?? '').trim();
  if (
    !s ||
    s === '-' ||
    s === '--' ||
    s === '—' ||
    s === '–' ||
    s === 'n/a' ||
    s === 'na' ||
    s === 'undefined' ||
    s === 'null'
  ) {
    return '';
  }
  return s;
}

function normText(value) {
  return blank(value).toLowerCase();
}

/** Level 1 / L1 / l1 → l1; empty stays empty so Level 1 is never Level 2. */
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

function inventoryIdentity(item = {}) {
  return {
    productName: normText(item.productName || item.product || item.product_name),
    class: normText(item.class),
    category: normText(item.category),
    level: normLevel(item.level),
    specs: normSpecs(item.specs),
    subject: normText(item.subject),
    supplier: normText(item.supplier || item.vendor),
  };
}

function inventoryIdentityKey(item) {
  const id = inventoryIdentity(item);
  return [
    id.productName,
    id.class,
    id.category,
    id.level,
    id.specs,
    id.subject,
    id.supplier,
  ].join('|');
}

function itemsHaveSameInventoryIdentity(a, b) {
  return inventoryIdentityKey(a) === inventoryIdentityKey(b);
}

function hasAssignedVendor(item = {}) {
  return Boolean(blank(item.supplier || item.vendor));
}

function isWarehouseLocationName(value) {
  const n = String(value || '').trim().toLowerCase();
  return Boolean(n) && n.includes('warehouse');
}

/** Product Level only. Do not treat warehouse location (e.g. Main Warehouse) as Level. */
function productLevelValue(item = {}) {
  const level = blank(item.level);
  if (level) return level;
  const loc = blank(item.location);
  if (!loc || isWarehouseLocationName(loc)) return '';
  return loc;
}

/** Stock page identity: Product + Product Category + Level + Specs + Subject. Vendor is ignored. */
function stockListIdentity(item = {}) {
  return {
    productName: normText(item.productName || item.product || item.product_name),
    category: normText(item.category),
    level: normLevel(productLevelValue(item)),
    specs: normSpecs(item.specs),
    subject: normText(item.subject),
  };
}

function stockListIdentityKey(item) {
  const id = stockListIdentity(item);
  return [id.productName, id.category, id.level, id.specs, id.subject].join('|');
}

function firstDisplayValue(group, getter) {
  for (const item of group) {
    const value = blank(getter(item));
    if (value) return value;
  }
  return '';
}

function consolidatedStockList(items) {
  const groups = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!hasAssignedVendor(item)) continue;
    if (!stockListIdentity(item).productName) continue;
    const key = stockListIdentityKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const rows = [];
  for (const [key, group] of groups.entries()) {
    const row = {
      _id: key,
      productName: firstDisplayValue(group, (item) => item.productName) || group[0].productName,
      category: firstDisplayValue(group, (item) => item.category),
      level: firstDisplayValue(group, (item) => productLevelValue(item)),
      specs: firstDisplayValue(group, (item) => item.specs),
      subject: firstDisplayValue(group, (item) => item.subject),
      currentStock: group.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0),
      sourceIds: group.map((item) => item._id).filter(Boolean),
    };
    rows.push(row);
  }

  rows.sort((a, b) =>
    String(a.productName || '').localeCompare(String(b.productName || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );
  return rows;
}

function warehouseDocsForStockRow(allItems, stockRow) {
  const sourceIds = (stockRow?.sourceIds || []).map((id) => String(id));
  if (sourceIds.length > 0) {
    const matched = (Array.isArray(allItems) ? allItems : []).filter((item) =>
      sourceIds.includes(String(item._id))
    );
    if (matched.length > 0) return matched;
  }
  const key = stockListIdentityKey(stockRow);
  if (!key || !stockListIdentity(stockRow).productName) return [];
  return (Array.isArray(allItems) ? allItems : []).filter(
    (item) => hasAssignedVendor(item) && stockListIdentityKey(item) === key
  );
}

function groupItemsByInventoryIdentity(items) {
  const groups = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!inventoryIdentity(item).productName) continue;
    const key = inventoryIdentityKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return ta - tb;
    });
  }
  return groups;
}

function findMatchingInventoryItems(items, incoming) {
  const key = inventoryIdentityKey(incoming);
  if (!inventoryIdentity(incoming).productName) return [];
  return (Array.isArray(items) ? items : [])
    .filter((item) => inventoryIdentityKey(item) === key)
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return ta - tb;
    });
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  blank,
  normText,
  normLevel,
  normSpecs,
  inventoryIdentity,
  inventoryIdentityKey,
  itemsHaveSameInventoryIdentity,
  hasAssignedVendor,
  findMatchingInventoryItems,
  groupItemsByInventoryIdentity,
  stockListIdentity,
  stockListIdentityKey,
  productLevelValue,
  consolidatedStockList,
  escapeRegex,
  warehouseDocsForStockRow,
};
