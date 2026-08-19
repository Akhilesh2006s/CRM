/**
 * Inventory identity for warehouse stock records.
 * Same product name is not enough — class, category, level, specs,
 * subject, item type, and vendor/supplier distinguish variants.
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
    itemType: normText(item.itemType),
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
    id.itemType,
    id.supplier,
  ].join('|');
}

function itemsHaveSameInventoryIdentity(a, b) {
  return inventoryIdentityKey(a) === inventoryIdentityKey(b);
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
  findMatchingInventoryItems,
  groupItemsByInventoryIdentity,
  escapeRegex,
};
