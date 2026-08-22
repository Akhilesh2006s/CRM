const User = require('../models/User');
const Product = require('../models/Product');
const DcOrder = require('../models/DcOrder');
const DC = require('../models/DC');
const Sale = require('../models/Sale');
const Warehouse = require('../models/Warehouse');
const StockReturn = require('../models/StockReturn');
const { ensureWarehouseInventoryIntegrity } = require('../utils/warehouseProductMaster');
const { isSuperAdminUser } = require('../utils/permissions');
const { VENDOR_MASTER_ROLES } = require('../utils/vendorMaster');

const VENDOR_DC_ROLES = [...VENDOR_MASTER_ROLES, 'Super Admin', 'Admin'];

function userRoles(user) {
  const roles = [];
  if (user?.role) roles.push(user.role);
  if (Array.isArray(user?.roles)) roles.push(...user.roles);
  return roles;
}

function canViewVendorDCs(user) {
  if (isSuperAdminUser(user)) return true;
  return userRoles(user).some((role) => VENDOR_DC_ROLES.includes(role));
}

function isPrivilegedVendorViewer(user) {
  return isSuperAdminUser(user) || userRoles(user).includes('Admin');
}

// Partner / Vendor users, plus Super Admin / Admin who open Vendor → My DCs
const ensurePartner = (req, res, next) => {
  if (!canViewVendorDCs(req.user)) {
    return res.status(403).json({ message: 'Access denied. Partner only.' });
  }
  next();
};

// Get partner's assigned product names (from Product model)
const getPartnerProductNames = async (partnerId) => {
  const user = await User.findById(partnerId)
    .select('partnerAssignedProducts')
    .populate('partnerAssignedProducts', 'productName')
    .lean();
  if (!user || !user.partnerAssignedProducts?.length) {
    return [];
  }
  return user.partnerAssignedProducts
    .map((p) => (typeof p === 'object' && p?.productName ? p.productName : null))
    .filter(Boolean);
};

/**
 * @route   GET /api/partner-user/dashboard
 * @access  Private (Partner only)
 * Returns summary cards + chart data for partner-assigned products
 */
const getPartnerDashboard = async (req, res) => {
  try {
    const productNames = await getPartnerProductNames(req.user._id);
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
    try {
      await ensureWarehouseInventoryIntegrity();
    } catch (_) {}
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
 * @route   GET /api/partner-user/stocks
 * @access  Private (Partner only)
 * Returns stock for partner-assigned products
 */
const getPartnerStocks = async (req, res) => {
  try {
    const productNames = await getPartnerProductNames(req.user._id);
    if (productNames.length === 0) {
      return res.json([]);
    }

    try {
      await ensureWarehouseInventoryIntegrity();
    } catch (_) {}
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

/**
 * @route   GET /api/partner-user/dcs
 * @access  Private (Partner only)
 * Returns DCs with schools and products for partner-assigned products
 */
const getPartnerDCs = async (req, res) => {
  try {
    const productNames = await getPartnerProductNames(req.user._id);
    const showAllAssigned = isPrivilegedVendorViewer(req.user);
    if (productNames.length === 0 && !showAllAssigned) {
      return res.json([]);
    }

    const PartnerCost = require('../models/VendorCost');
    const costMap = {};
    const addCostRow = (productCost) => {
      let productName = null;
      if (productCost.productId && typeof productCost.productId === 'object' && productCost.productId.productName) {
        productName = productCost.productId.productName;
      } else if (productCost.productName) {
        productName = productCost.productName;
      }
      if (!productName) return;
      if (productNames.length && !productNames.includes(productName)) return;

      const enterpriseMap = {};
      const groups = [
        ...(Array.isArray(productCost.franchises) ? productCost.franchises : []),
        ...(Array.isArray(productCost.enterprises) ? productCost.enterprises : []),
      ];
      groups.forEach((group) => {
        const cost = group.franchiseCost ?? group.enterpriseCost;
        (group.schools || []).forEach((school) => {
          let schoolId = null;
          if (school.schoolId) {
            schoolId = typeof school.schoolId === 'object' && school.schoolId._id
              ? school.schoolId._id.toString()
              : school.schoolId.toString();
          }
          if (schoolId && cost !== undefined && cost !== null) {
            enterpriseMap[schoolId] = cost;
          }
        });
      });
      const row = {
        defaultCost: Number(productCost.defaultCost) || 0,
        enterpriseMap,
      };
      costMap[productName] = row;
      costMap[String(productName).toLowerCase()] = row;
    };

    const ownCost = await PartnerCost.findOne({ partnerId: req.user._id })
      .populate('products.productId', 'productName')
      .lean();
    (ownCost?.products || []).forEach(addCostRow);

    if (showAllAssigned) {
      const allCosts = await PartnerCost.find({})
        .populate('products.productId', 'productName')
        .lean();
      allCosts.forEach((doc) => {
        (doc.products || []).forEach(addCostRow);
      });
    }

    const allowAllProducts = productNames.length === 0;
    const matchesAssigned = (name) => Boolean(name) && (allowAllProducts || productNames.includes(name));

    const lineUnitPrice = (line) => {
      if (!line) return 0;
      for (const v of [line.unit_price, line.unitPrice, line.price]) {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return 0;
    };

    const assignedUnitPrice = (productName, schoolId, line, order) => {
      const costInfo = costMap[productName] || costMap[String(productName).toLowerCase()] || { defaultCost: 0, enterpriseMap: {} };
      if (schoolId && costInfo.enterpriseMap[schoolId] !== undefined) {
        const schoolCost = Number(costInfo.enterpriseMap[schoolId]);
        if (schoolCost > 0) return schoolCost;
      }
      if (Number(costInfo.defaultCost) > 0) return Number(costInfo.defaultCost);
      const fromLine = lineUnitPrice(line);
      if (fromLine > 0) return fromLine;
      const orderRow = (order?.products || []).find((p) => {
        const n = p.product_name || p.productName || p.product;
        return n && String(n).toLowerCase() === String(productName).toLowerCase();
      });
      return lineUnitPrice(orderRow);
    };

    const dcQuery = allowAllProducts
      ? {}
      : {
          $or: [
            { product: { $in: productNames } },
            { 'productDetails.productName': { $in: productNames } },
          ],
        };
    const dcs = await DC.find(dcQuery)
      .populate('dcOrderId', 'school_name school_code zone location contact_person contact_mobile email address dc_code _id products')
      .populate('employeeId', 'name email')
      .select('_id dcOrderId product productDetails deliverableQuantity requestedQuantity status dcDate createdAt employeeId customerName')
      .sort({ createdAt: -1 })
      .lean();

    const transformed = dcs.map((dc) => {
      const school = dc.dcOrderId || {};
      const schoolId = school._id ? school._id.toString() : null;
      const products = [];
      let totalPrice = 0;
      const details = Array.isArray(dc.productDetails) ? dc.productDetails : [];

      const seen = new Set();
      const pushProduct = (productName, quantity, line) => {
        if (!matchesAssigned(productName) || seen.has(productName)) return;
        seen.add(productName);
        const unitPrice = assignedUnitPrice(productName, schoolId, line, school);
        const qty = Number(quantity) || 0;
        const price = unitPrice * qty;
        totalPrice += price;
        products.push({
          productName,
          quantity: qty,
          unitPrice,
          price,
          isEnterprise: Boolean(schoolId && (costMap[productName] || costMap[String(productName).toLowerCase()])?.enterpriseMap?.[schoolId] !== undefined),
        });
      };

      const headerMatch = details.find((pd) => {
        const n = pd.productName || pd.product;
        return n && dc.product && String(n).toLowerCase() === String(dc.product).toLowerCase();
      });
      pushProduct(dc.product, dc.deliverableQuantity || dc.requestedQuantity, headerMatch);
      details.forEach((pd) => {
        pushProduct(pd.productName || pd.product, pd.quantity, pd);
      });

      return {
        _id: dc._id,
        dcDate: dc.dcDate || dc.createdAt,
        status: dc.status,
        school: {
          _id: school._id,
          name: school.school_name || dc.customerName || 'N/A',
          code: school.school_code || '-',
          zone: school.zone || '-',
          location: school.location || '-',
          contactPerson: school.contact_person || '-',
          contactMobile: school.contact_mobile || '-',
          dcCode: school.dc_code || '-',
        },
        employee: dc.employeeId ? {
          name: dc.employeeId.name || 'N/A',
          email: dc.employeeId.email || '-',
        } : null,
        products: products,
        totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
        totalPrice: totalPrice,
      };
    }).filter(dc => dc.products.length > 0);

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPartnerDashboard,
  getPartnerStocks,
  getPartnerDCs,
  ensurePartner,
};
