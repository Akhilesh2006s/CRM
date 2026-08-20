const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const {
  findIdentityMatches,
  mergeIdentityDuplicates,
  addQuantityToExistingIdentity,
} = require('../utils/warehouseDuplicateConsolidate');
const { sanitizeWarehousePayload, ensureWarehouseInventoryIntegrity } = require('../utils/warehouseProductMaster');
const { consolidatedStockList } = require('../utils/warehouseInventoryIdentity');
const { loadInventoryItemList } = require('../utils/warehouseStockRecords');

// @desc    Get distinct warehouse locations (for return form dropdown)
// @route   GET /api/warehouse/locations
// @access  Private
const getWarehouseLocations = async (req, res) => {
  try {
    res.json(['Main Warehouse']);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all warehouse items
// @route   GET /api/warehouse
// @access  Private
const getWarehouse = async (req, res) => {
  try {
    const list = await loadInventoryItemList(req.query || {});
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get consolidated stock from Inventory Items only
// @route   GET /api/warehouse/stock-list
// @access  Private
const getWarehouseStockList = async (req, res) => {
  try {
    const inventoryItems = await loadInventoryItemList(req.query || {});
    res.json(consolidatedStockList(inventoryItems));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock
// @route   POST /api/warehouse/stock
// @access  Private
const updateStock = async (req, res) => {
  try {
    const { productId, quantity, movementType, reason, relatedSaleId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Inventory item ID is required' });
    }

    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum)) {
      return res.status(400).json({ message: 'Quantity must be a number' });
    }
    if (movementType === 'Adjustment') {
      if (qtyNum < 0) {
        return res.status(400).json({ message: 'Quantity cannot be negative' });
      }
    } else if (qtyNum <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    const product = await Warehouse.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Warehouse item not found' });
    }

    if (movementType === 'In') {
      const updated = await addQuantityToExistingIdentity(product.toObject(), qtyNum, productId);
      if (req.user?._id) {
        await StockMovement.create({
          productId: updated._id,
          movementType: 'In',
          quantity: qtyNum,
          reason: reason || 'Add item quantity',
          relatedSaleId,
          createdBy: req.user._id,
        });
      }
      return res.json(updated);
    }

    // Add/remove quantity on THIS inventory item only. Do not change identity fields.
    let newStock = Number(product.currentStock) || 0;
    if (movementType === 'Out' || movementType === 'Return') {
      newStock -= qtyNum;
    } else if (movementType === 'Adjustment') {
      newStock = qtyNum;
    } else {
      return res.status(400).json({ message: 'Invalid movement type' });
    }

    product.currentStock = newStock;
    await product.save();

    await StockMovement.create({
      productId,
      movementType,
      quantity: qtyNum,
      reason,
      relatedSaleId,
      createdBy: req.user._id,
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get warehouse reports
// @route   GET /api/warehouse/reports
// @access  Private
const getWarehouseReports = async (req, res) => {
  try {
    try {
      await ensureWarehouseInventoryIntegrity();
    } catch (mergeErr) {
      console.warn('Warehouse Product Master align skipped:', mergeErr?.message || mergeErr);
    }
    const lowStockItems = await Warehouse.find({
      status: 'Low Stock',
    });

    const outOfStockItems = await Warehouse.find({
      status: 'Out of Stock',
    });

    const totalItems = await Warehouse.countDocuments();
    const totalValue = await Warehouse.aggregate([
      {
        $project: {
          total: { $multiply: ['$currentStock', '$unitPrice'] },
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$total' },
        },
      },
    ]);

    res.json({
      lowStockItems,
      outOfStockItems,
      totalItems,
      totalValue: totalValue[0]?.totalValue || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single warehouse item
// @route   GET /api/warehouse/:id
// @access  Private
const getWarehouseItem = async (req, res) => {
  try {
    const existing = await Warehouse.findById(req.params.id);
    try {
      await ensureWarehouseInventoryIntegrity();
    } catch (mergeErr) {
      console.warn('Warehouse Product Master align skipped:', mergeErr?.message || mergeErr);
    }
    const item = await Warehouse.findById(req.params.id);
    if (item) {
      const json = item.toObject();
      delete json.itemType;
      return res.json(json);
    }
    if (existing) {
      const matches = await findIdentityMatches(existing.toObject());
      if (matches[0]) {
        const json = matches[0].toObject ? matches[0].toObject() : { ...matches[0] };
        delete json.itemType;
        return res.json(json);
      }
    }
    return res.status(404).json({ message: 'Warehouse item not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create warehouse item
// @route   POST /api/warehouse
// @access  Private
const createWarehouseItem = async (req, res) => {
  try {
    const body = { ...(req.body || {}) };
    if (body.vendor && !body.supplier) body.supplier = body.vendor;
    delete body.vendor;

    const sanitized = await sanitizeWarehousePayload(body);
    if (!sanitized.ok) {
      return res.status(400).json({ message: sanitized.message });
    }
    Object.assign(body, sanitized.payload);
    delete body.itemType;

    const qty = Number(body.currentStock);
    const addQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    if (!String(body.productName || '').trim()) {
      return res.status(400).json({ message: 'Product is required' });
    }

    const matches = await findIdentityMatches(body);
    if (matches.length > 0) {
      const updated = await addQuantityToExistingIdentity(body, addQty);
      if (addQty > 0 && req.user?._id) {
        await StockMovement.create({
          productId: updated._id,
          movementType: 'In',
          quantity: addQty,
          reason: 'Add item quantity',
          createdBy: req.user._id,
        });
      }
      const json = updated.toObject ? updated.toObject() : updated;
      json.merged = true;
      return res.status(200).json(json);
    }

    body.currentStock = addQty;
    const item = await Warehouse.create(body);
    if (addQty > 0 && req.user?._id) {
      await StockMovement.create({
        productId: item._id,
        movementType: 'In',
        quantity: addQty,
        reason: 'Add item quantity',
        createdBy: req.user._id,
      }).catch(() => {});
    }
    const json = item.toObject();
    json.merged = false;
    res.status(201).json(json);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update warehouse item
// @route   PUT /api/warehouse/:id
// @access  Private
const updateWarehouseItem = async (req, res) => {
  try {
    const body = { ...(req.body || {}) };
    if (body.vendor && !body.supplier) body.supplier = body.vendor;
    delete body.vendor;
    const sanitized = await sanitizeWarehousePayload(body);
    if (!sanitized.ok) {
      return res.status(400).json({ message: sanitized.message });
    }
    Object.assign(body, sanitized.payload);
    delete body.itemType;
    const item = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { $set: body, $unset: { itemType: 1 } },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Warehouse item not found' });
    }
    const matches = await findIdentityMatches(item.toObject());
    if (matches.length > 1) {
      const preferred = [item, ...matches.filter((m) => String(m._id) !== String(item._id))];
      const merged = await mergeIdentityDuplicates(preferred);
      return res.json(merged || item);
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWarehouse,
  getWarehouseStockList,
  getWarehouseLocations,
  getWarehouseItem,
  createWarehouseItem,
  updateWarehouseItem,
  updateStock,
  getWarehouseReports,
};

