const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');

// @desc    Get all warehouse items
// @route   GET /api/warehouse
// @access  Private
const getWarehouse = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const items = await Warehouse.find(filter).sort({ createdAt: -1 });
    res.json(items);
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

    const product = await Warehouse.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newStock = product.currentStock;
    if (movementType === 'In') {
      newStock += quantity;
    } else if (movementType === 'Out' || movementType === 'Return') {
      newStock -= quantity;
    } else if (movementType === 'Adjustment') {
      newStock = quantity;
    }

    product.currentStock = newStock;
    if (movementType === 'In') {
      product.lastRestocked = new Date();
    }
    await product.save();

    // Record stock movement
    await StockMovement.create({
      productId,
      movementType,
      quantity,
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

module.exports = {
  getWarehouse,
  updateStock,
  getWarehouseReports,
};

