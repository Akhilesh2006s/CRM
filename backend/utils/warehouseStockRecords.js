/**
 * Shared Stock records for Warehouse screens and DC @ Warehouse submit.
 * GET /warehouse/stock-list and warehouse-process must use this same list.
 */
const Warehouse = require('../models/Warehouse');
const { aggregatedWarehouseList } = require('./warehouseDuplicateConsolidate');
const {
  ensureWarehouseInventoryIntegrity,
  filterWarehouseItemsToProductMaster,
  loadProductIndex,
} = require('./warehouseProductMaster');
const {
  hasAssignedVendor,
  consolidatedStockList,
} = require('./warehouseInventoryIdentity');

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
  }

  const items = await Warehouse.find(filter).sort({ createdAt: -1 });
  let list = aggregatedWarehouseList(items);
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
