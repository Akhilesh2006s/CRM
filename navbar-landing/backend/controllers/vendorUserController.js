const User = require('../models/User');
const Product = require('../models/Product');
const DcOrder = require('../models/DcOrder');
const DC = require('../models/DC');
const Sale = require('../models/Sale');
const Warehouse = require('../models/Warehouse');
const StockReturn = require('../models/StockReturn');

// Ensure user is Vendor role
const ensureVendor = (req, res, next) => {
  if (req.user?.role !== 'Vendor') {
    return res.status(403).json({ message: 'Access denied. Vendor only.' });
  }
  next();
};

// Get vendor's assigned product names (from Product model)
const getVendorProductNames = async (vendorId) => {
  const user = await User.findById(vendorId)
    .select('vendorAssignedProducts')
    .populate('vendorAssignedProducts', 'productName')
    .lean();
  if (!user || !user.vendorAssignedProducts?.length) {
    return [];
  }
  return user.vendorAssignedProducts
    .map((p) => (typeof p === 'object' && p?.productName ? p.productName : null))
    .filter(Boolean);
};

/**
 * @route   GET /api/vendor-user/dashboard
 * @access  Private (Vendor only)
 * Returns summary cards + chart data for vendor-assigned products
 */
const getVendorDashboard = async (req, res) => {
  try {
    const productNames = await getVendorProductNames(req.user._id);
    if (productNames.length === 0) {
      return res.json({
        summary: {
          totalAssignedProducts: 0,
          totalDcQuantityLast30Days: 0,
          pendingDcQuantity: 0,
          totalReturns: 0,
        },
        productWiseDcCount: [],
        monthlyProductMovement: [],
        productContribution: [],
        dispatchVsPending: { dispatched: 0, pending: 0 },
        returnTrend: [],
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. DcOrder: products[].product_name, quantity. Status for pending
    const dcOrders = await DcOrder.find({
      'products.product_name': { $in: productNames },
      $or: [
        { status: { $in: ['pending', 'dc_requested', 'dc_accepted', 'dc_approved', 'dc_sent_to_senior', 'in_transit'] } },
        { createdAt: { $gte: thirtyDaysAgo } },
      ],
    })
      .select('products status createdAt')
      .lean();

    // 2. DC (dispatch records): product (string), productDetails[].productName, deliverableQuantity, requestedQuantity, status
    const dcs = await DC.find({
      $or: [
        { product: { $in: productNames } },
        { 'productDetails.productName': { $in: productNames } },
      ],
    })
      .select('product productDetails deliverableQuantity requestedQuantity status createdAt')
      .lean();

    // 3. Warehouse stock (for product names)
    const warehouseItems = await Warehouse.find({
      productName: { $in: productNames },
    })
      .select('productName productCode currentStock minStock updatedAt')
      .lean();

    // 4. StockReturn: products[].product
    const returns = await StockReturn.find({
      'products.product': { $in: productNames },
    })
      .select('products returnDate')
      .lean();

    // --- Summary ---
    let totalDcQtyLast30Days = 0;
    let pendingDcQty = 0;

    dcOrders.forEach((order) => {
      const inLast30 = new Date(order.createdAt) >= thirtyDaysAgo;
      order.products?.forEach((p) => {
        if (productNames.includes(p.product_name)) {
          const qty = p.quantity || 0;
          if (inLast30) totalDcQtyLast30Days += qty;
          const isPending = ['pending', 'dc_requested', 'dc_accepted', 'dc_approved', 'dc_sent_to_senior', 'in_transit'].includes(order.status);
          if (isPending) pendingDcQty += qty;
        }
      });
    });

    dcs.forEach((dc) => {
      const inLast30 = new Date(dc.createdAt) >= thirtyDaysAgo;
      if (dc.product && productNames.includes(dc.product)) {
        const qty = dc.deliverableQuantity || dc.requestedQuantity || 0;
        if (inLast30) totalDcQtyLast30Days += qty;
        if (dc.status !== 'completed' && dc.status !== 'hold') {
          pendingDcQty += (dc.requestedQuantity || 0) - (dc.deliverableQuantity || 0);
          if (pendingDcQty < 0) pendingDcQty = 0;
        }
      }
      (dc.productDetails || []).forEach((pd) => {
        if (pd.productName && productNames.includes(pd.productName)) {
          const qty = pd.quantity || 0;
          if (inLast30) totalDcQtyLast30Days += qty;
        }
      });
    });

    let totalReturns = 0;
    returns.forEach((r) => {
      (r.products || []).forEach((p) => {
        if (p.product && productNames.includes(p.product)) {
          totalReturns += p.returnQty || 0;
        }
      });
    });

    // --- Product-wise DC count ---
    const productCountMap = {};
    productNames.forEach((n) => { productCountMap[n] = 0; });

    dcOrders.forEach((order) => {
      order.products?.forEach((p) => {
        if (productNames.includes(p.product_name)) {
          productCountMap[p.product_name] = (productCountMap[p.product_name] || 0) + 1;
        }
      });
    });
    dcs.forEach((dc) => {
      if (dc.product && productNames.includes(dc.product)) {
        productCountMap[dc.product] = (productCountMap[dc.product] || 0) + 1;
      }
      (dc.productDetails || []).forEach((pd) => {
        if (pd.productName && productNames.includes(pd.productName)) {
          productCountMap[pd.productName] = (productCountMap[pd.productName] || 0) + 1;
        }
      });
    });

    const productWiseDcCount = productNames.map((name) => ({
      product: name,
      count: productCountMap[name] || 0,
    }));

    // --- Monthly product movement ---
    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), qty: 0 };
    }

    dcOrders.forEach((order) => {
      const m = new Date(order.createdAt);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        order.products?.forEach((p) => {
          if (productNames.includes(p.product_name)) {
            monthMap[key].qty += p.quantity || 0;
          }
        });
      }
    });
    dcs.forEach((dc) => {
      const m = new Date(dc.createdAt);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        if (dc.product && productNames.includes(dc.product)) {
          monthMap[key].qty += dc.deliverableQuantity || dc.requestedQuantity || 0;
        }
        (dc.productDetails || []).forEach((pd) => {
          if (pd.productName && productNames.includes(pd.productName)) {
            monthMap[key].qty += pd.quantity || 0;
          }
        });
      }
    });

    const monthlyProductMovement = Object.entries(monthMap).map(([k, v]) => ({
      month: k,
      label: v.label,
      quantity: v.qty,
    }));

    // --- Product contribution (pie) ---
    const totalQty = productWiseDcCount.reduce((s, x) => s + x.count, 0);
    const productContribution = productNames.map((name) => {
      const count = productCountMap[name] || 0;
      return { product: name, count, percentage: totalQty > 0 ? Math.round((count / totalQty) * 100) : 0 };
    });

    // --- Dispatch vs Pending ---
    let dispatched = 0;
    let pending = 0;
    dcs.forEach((dc) => {
      const matches =
        (dc.product && productNames.includes(dc.product)) ||
        (dc.productDetails || []).some((pd) => pd.productName && productNames.includes(pd.productName));
      if (matches) {
        dispatched += dc.deliverableQuantity || 0;
        if (dc.status !== 'completed' && dc.status !== 'hold') {
          pending += Math.max(0, (dc.requestedQuantity || 0) - (dc.deliverableQuantity || 0));
        }
      }
    });

    // --- Return trend (last 6 months) ---
    const returnMonthMap = {};
    Object.keys(monthMap).forEach((k) => { returnMonthMap[k] = 0; });
    returns.forEach((r) => {
      const m = new Date(r.returnDate || r.createdAt);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      if (returnMonthMap[key] !== undefined) {
        (r.products || []).forEach((p) => {
          if (p.product && productNames.includes(p.product)) {
            returnMonthMap[key] += p.returnQty || 0;
          }
        });
      }
    });
    const returnTrend = Object.entries(returnMonthMap).map(([k]) => ({
      month: k,
      label: monthMap[k]?.label || k,
      quantity: returnMonthMap[k] || 0,
    }));

    res.json({
      summary: {
        totalAssignedProducts: productNames.length,
        totalDcQuantityLast30Days: totalDcQtyLast30Days,
        pendingDcQuantity: Math.max(0, pendingDcQty),
        totalReturns,
      },
      productWiseDcCount,
      monthlyProductMovement,
      productContribution,
      dispatchVsPending: { dispatched, pending },
      returnTrend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/vendor-user/stocks
 * @access  Private (Vendor only)
 * Returns stock for vendor-assigned products
 */
const getVendorStocks = async (req, res) => {
  try {
    const productNames = await getVendorProductNames(req.user._id);
    if (productNames.length === 0) {
      return res.json([]);
    }

    const items = await Warehouse.find({
      productName: { $in: productNames },
    })
      .select('productName productCode currentStock minStock maxStock status updatedAt')
      .sort({ productName: 1 })
      .lean();

    const stocks = items.map((item) => ({
      _id: item._id,
      productName: item.productName,
      productCode: item.productCode || '-',
      availableQuantity: item.currentStock ?? 0,
      reservedQuantity: 0,
      minStock: item.minStock ?? 0,
      status: item.status,
      lastUpdated: item.updatedAt,
      isLowStock: (item.currentStock ?? 0) <= (item.minStock ?? 0),
    }));

    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVendorDashboard,
  getVendorStocks,
  ensureVendor,
};
