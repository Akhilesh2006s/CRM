const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const {
  productAssignmentKey,
  resolveAssignedVendor,
  productVendorNameMap,
} = require('./vendorProductAssignment');

const VENDOR_MASTER_ROLES = ['Partner', 'Vendor'];

function vendorDisplayName(user) {
  const name = String(user?.name || '').trim();
  if (name) return name;
  const firstLast = [user?.firstName, user?.lastName].map((v) => String(v || '').trim()).filter(Boolean);
  return firstLast.join(' ').trim();
}

function addVendor(records, seen, name, id) {
  const display = String(name || '').trim();
  if (!display || display === '-' || /^n\/?a$/i.test(display)) return;
  const key = display.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  records.push({
    _id: id ? String(id) : undefined,
    name: display,
  });
}

function assignedProductName(product) {
  if (!product) return '';
  if (typeof product === 'object') {
    return String(product.productName || product.name || '').trim();
  }
  return '';
}

/**
 * productName (lowercase) → [{ _id, name }] from Vendor master assigned products.
 */
async function loadProductVendorAssignments() {
  const users = await User.find({
    $or: [
      { role: { $in: VENDOR_MASTER_ROLES } },
      { roles: { $in: VENDOR_MASTER_ROLES } },
    ],
    isActive: { $ne: false },
  })
    .select('_id name firstName lastName partnerAssignedProducts')
    .populate('partnerAssignedProducts', 'productName')
    .lean();

  const pending = [];
  const unresolvedIds = [];
  for (const user of users) {
    const vendor = {
      _id: user._id,
      name: vendorDisplayName(user),
    };
    if (!vendor.name) continue;
    const products = Array.isArray(user.partnerAssignedProducts) ? user.partnerAssignedProducts : [];
    for (const product of products) {
      const pname = assignedProductName(product);
      if (pname) {
        pending.push({ vendor, key: productAssignmentKey(pname) });
        continue;
      }
      const id = String(product?._id || product || '').trim();
      if (!id) continue;
      unresolvedIds.push(id);
      pending.push({ vendor, id });
    }
  }

  const idToName = new Map();
  if (unresolvedIds.length) {
    const docs = await Product.find({ _id: { $in: unresolvedIds } }).select('productName').lean();
    for (const doc of docs) {
      const name = String(doc.productName || '').trim();
      if (name) idToName.set(String(doc._id), name);
    }
  }

  const byProduct = new Map();
  for (const row of pending) {
    const key = row.key || productAssignmentKey(idToName.get(row.id) || '');
    if (!key) continue;
    if (!byProduct.has(key)) byProduct.set(key, []);
    const list = byProduct.get(key);
    if (!list.some((v) => String(v._id) === String(row.vendor._id))) list.push(row.vendor);
  }
  console.log(
    '[vendor-master] product assignments:',
    Array.from(byProduct.entries()).map(([k, list]) => `${k}→${list.map((v) => v.name).join(',')}`)
  );
  return byProduct;
}

/**
 * Rewrite warehouse.supplier / vendorId to the Vendor master assignment for that product.
 */
async function remapWarehouseVendorsFromAssignments() {
  const byProduct = await loadProductVendorAssignments();
  if (!byProduct.size) return { updated: 0 };

  const items = await Warehouse.find({}).select('_id productName supplier vendorId');
  let updated = 0;
  for (const item of items) {
    const resolved = resolveAssignedVendor(item.productName, item.supplier, byProduct);
    if (!resolved.assigned.length || !resolved.selectedName) continue;
    const sameName =
      String(item.supplier || '').trim().toLowerCase() === resolved.selectedName.toLowerCase();
    const sameId = String(item.vendorId || '') === String(resolved.vendorId || '');
    if (sameName && sameId) continue;
    const set = { supplier: resolved.selectedName };
    if (resolved.vendorId) set.vendorId = resolved.vendorId;
    await Warehouse.updateOne({ _id: item._id }, { $set: set });
    updated += 1;
  }
  return { updated };
}

/**
 * All active vendors from Vendor master.
 * Never filtered by product, category, specs, level, or subject.
 */
async function listActiveVendorMaster() {
  const records = [];
  const seen = new Set();

  const users = await User.find({
    role: { $in: VENDOR_MASTER_ROLES },
    isActive: { $ne: false },
  })
    .select('_id name firstName lastName isActive role')
    .sort({ name: 1 })
    .lean();

  for (const user of users) {
    addVendor(records, seen, vendorDisplayName(user), user._id);
  }

  // Warehouse supplier names are the same Vendor master values used on stock
  // items. Distinct across ALL rows — no product/category match.
  const suppliers = await Warehouse.distinct('supplier');
  for (const supplier of suppliers) {
    addVendor(records, seen, supplier);
  }

  // Original inventory-options Vendor master (User table has no Partner rows).
  if (!users.length) {
    for (const name of ['Vendor 1', 'Vendor 2', 'Vendor 3']) {
      addVendor(records, seen, name);
    }
  }

  records.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  console.log('[vendor-master] fetched vendors:', records.map((v) => v.name));
  return records;
}

module.exports = {
  VENDOR_MASTER_ROLES,
  vendorDisplayName,
  productAssignmentKey,
  resolveAssignedVendor,
  productVendorNameMap,
  loadProductVendorAssignments,
  remapWarehouseVendorsFromAssignments,
  listActiveVendorMaster,
};
