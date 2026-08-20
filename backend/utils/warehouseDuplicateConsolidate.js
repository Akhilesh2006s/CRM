/**
 * Combine warehouse rows that share the same complete inventory identity.
 * Quantity is summed onto the oldest record. StockMovement.productId is
 * retargeted before duplicate Warehouse documents are removed.
 */
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const {
  findMatchingInventoryItems,
  groupItemsByInventoryIdentity,
  escapeRegex,
} = require('./warehouseInventoryIdentity');

function stockStatus(currentStock, minStock = 0) {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minStock) return 'Low Stock';
  return 'In Stock';
}

async function findIdentityMatches(incoming) {
  const name = String(incoming.productName || incoming.product || incoming.product_name || '').trim();
  if (!name) return [];
  const candidates = await Warehouse.find({
    productName: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  }).sort({ createdAt: 1 });
  return findMatchingInventoryItems(candidates, incoming);
}

async function mergeIdentityDuplicates(matches) {
  if (!Array.isArray(matches) || matches.length <= 1) return matches?.[0] || null;
  const [canonical, ...dupes] = matches;
  const extra = dupes.reduce((sum, row) => sum + (Number(row.currentStock) || 0), 0);
  const combined = (Number(canonical.currentStock) || 0) + extra;
  const update = {
    $set: {
      status: stockStatus(combined, canonical.minStock),
    },
  };
  if (extra) {
    update.$inc = { currentStock: extra };
    update.$set.lastRestocked = new Date();
  }
  await Warehouse.updateOne({ _id: canonical._id }, update);
  const dupeIds = dupes.map((d) => d._id);
  await StockMovement.updateMany(
    { productId: { $in: dupeIds } },
    { $set: { productId: canonical._id } }
  );
  await Warehouse.deleteMany({ _id: { $in: dupeIds } });
  return Warehouse.findById(canonical._id);
}

async function consolidateDuplicateWarehouseItems() {
  const items = await Warehouse.find({}).sort({ createdAt: 1 });
  const groups = groupItemsByInventoryIdentity(items);
  for (const group of groups.values()) {
    if (group.length > 1) {
      await mergeIdentityDuplicates(group);
    }
  }
}

let consolidating = null;
async function ensureDuplicatesConsolidated() {
  if (!consolidating) {
    consolidating = consolidateDuplicateWarehouseItems().finally(() => {
      consolidating = null;
    });
  }
  await consolidating;
}

async function addQuantityToExistingIdentity(incoming, addQty, preferredId) {
  const matches = await findIdentityMatches(incoming);
  if (matches.length === 0) return null;

  const preferred = preferredId
    ? matches.find((m) => String(m._id) === String(preferredId))
    : null;
  const ordered = preferred
    ? [preferred, ...matches.filter((m) => String(m._id) !== String(preferredId))]
    : matches;
  const canonical = await mergeIdentityDuplicates(ordered);

  const updated = await Warehouse.findByIdAndUpdate(
    canonical._id,
    {
      $inc: { currentStock: addQty },
      $set: { lastRestocked: new Date() },
    },
    { new: true }
  );
  if (updated) {
    updated.status = stockStatus(updated.currentStock, updated.minStock);
    await updated.save();
  }
  return updated || canonical;
}

function toPlain(item) {
  if (!item) return item;
  if (typeof item.toObject === 'function') return item.toObject();
  return { ...item };
}

function aggregatedWarehouseList(items) {
  const list = Array.isArray(items) ? items : [];
  const groups = groupItemsByInventoryIdentity(list);
  const used = new Set();
  const rows = [];
  for (const group of groups.values()) {
    const [canonical] = group;
    const row = toPlain(canonical);
    delete row.itemType;
    row.currentStock = group.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0);
    rows.push(row);
    for (const item of group) used.add(String(item._id));
  }
  for (const item of list) {
    if (!used.has(String(item._id))) {
      const extra = toPlain(item);
      delete extra.itemType;
      rows.push(extra);
    }
  }
  rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return rows;
}

module.exports = {
  stockStatus,
  findIdentityMatches,
  mergeIdentityDuplicates,
  ensureDuplicatesConsolidated,
  addQuantityToExistingIdentity,
  aggregatedWarehouseList,
};
