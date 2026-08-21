const User = require('../models/User');
const Warehouse = require('../models/Warehouse');

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
  listActiveVendorMaster,
};
