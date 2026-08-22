/**
 * Shared Stock records for Warehouse screens and DC @ Warehouse submit.
 * GET /warehouse/stock-list and warehouse-process must use this same list.
 */
const Warehouse = require('../models/Warehouse');
const { aggregatedWarehouseList, ensureDuplicatesConsolidated } = require('./warehouseDuplicateConsolidate');
const {
  ensureWarehouseInventoryIntegrity,
  filterWarehouseItemsToProductMaster,
  loadProductIndex,
} = require('./warehouseProductMaster');
const {
  hasAssignedVendor,
  consolidatedStockList,
} = require('./warehouseInventoryIdentity');
const {
  loadProductVendorAssignments,
  remapWarehouseVendorsFromAssignments,
  resolveAssignedVendor,
} = require('./vendorMaster');

function applyAssignedVendorToItem(item, byProduct) {
  const resolved = resolveAssignedVendor(item.productName, item.supplier || item.vendor, byProduct);
  if (!resolved.assigned.length || !resolved.selectedName) return item;
  const row = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  row.supplier = resolved.selectedName;
  row.vendor = resolved.selectedName;
  if (resolved.vendorId) row.vendorId = resolved.vendorId;
  return row;
}

async function loadInventoryItemList(query = {}, options = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  if (!options.skipAlign) {
    try {
      await ensureWarehouseInventoryIntegrity();
    } catch (mergeErr) {
      console.warn('Warehouse Product Master align skipped:', mergeErr?.message || mergeErr);
    }
    try {
      const remapped = await remapWarehouseVendorsFromAssignments();
      if (remapped?.updated) {
        console.log(`[warehouse] remapped ${remapped.updated} inventory rows to assigned vendors`);
      }
      await ensureDuplicatesConsolidated();
    } catch (err) {
      console.warn('Warehouse vendor assignment remap skipped:', err?.message || err);
    }
  }

  const items = await Warehouse.find(filter).sort({ createdAt: -1 });
  let list = items;
  try {
    const byProduct = await loadProductVendorAssignments();
    if (byProduct.size) {
      list = items.map((item) => applyAssignedVendorToItem(item, byProduct));
    }
  } catch (err) {
    console.warn('Warehouse vendor list mapping skipped:', err?.message || err);
  }
  list = aggregatedWarehouseList(list);
  try {
    const { byName } = await loadProductIndex();
    list = filterWarehouseItemsToProductMaster(list, byName);
  } catch (_) {}
  return list.filter(hasAssignedVendor);
}

async function loadDcWarehouseStock(query = {}, options = {}) {
  const inventoryItems = await loadInventoryItemList(query, options);
  return {
    inventoryItems,
    stock: consolidatedStockList(inventoryItems),
  };
}

module.exports = {
  loadInventoryItemList,
  loadDcWarehouseStock,
};
