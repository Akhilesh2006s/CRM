/**
 * Product Master is the single source of truth for warehouse inventory SKUs.
 * Category / level / specs / subject may only be stored when that product
 * actually defines them, and only with catalog values.
 */
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { blank, normText, normLevel } = require('./warehouseInventoryIdentity');
const { ensureDuplicatesConsolidated } = require('./warehouseDuplicateConsolidate');

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function productKey(name) {
  return String(name || '').trim().toLowerCase();
}

function catalogDimensions(product) {
  const levels = asStringArray(product?.productLevels);
  const specs = product?.hasSpecs === true ? asStringArray(product?.specs) : [];
  const subjects = product?.hasSubjects === true ? asStringArray(product?.subjects) : [];
  const categories = product?.hasCategory === true ? asStringArray(product?.categories) : [];
  return {
    productName: String(product?.productName || '').trim(),
    hasLevels: levels.length > 0,
    levels,
    hasSpecs: specs.length > 0,
    specs,
    hasSubjects: subjects.length > 0,
    subjects,
    hasCategories: categories.length > 0,
    categories,
  };
}

function findAllowedText(value, allowed) {
  const n = normText(value);
  if (!n) return '';
  const match = (allowed || []).find((a) => normText(a) === n);
  return match || null;
}

function findAllowedLevel(value, allowed) {
  const n = normLevel(value);
  if (!n) return '';
  const match = (allowed || []).find((a) => normLevel(a) === n);
  return match || null;
}

function fieldChanged(before, after) {
  return blank(before) !== blank(after);
}

/**
 * Map an inventory payload onto a Product Master document.
 * Inapplicable fields are cleared. Invalid required values fail.
 */
function applyInventoryToProductMaster(item, product) {
  if (!product) {
    return { ok: false, message: 'Product is not in Product Master' };
  }

  const dims = catalogDimensions(product);
  const payload = {
    productName: dims.productName,
    category: '',
    level: '',
    specs: '',
    subject: '',
    class: '',
  };

  if (dims.hasCategories) {
    const match = findAllowedText(item?.category, dims.categories);
    if (!match) {
      return {
        ok: false,
        message: `Product Category must be one of: ${dims.categories.join(', ')}`,
      };
    }
    payload.category = match;
  }

  if (dims.hasLevels) {
    const match = findAllowedLevel(item?.level, dims.levels);
    if (!match) {
      return {
        ok: false,
        message: `Level must be one of: ${dims.levels.join(', ')}`,
      };
    }
    payload.level = match;
  }

  if (dims.hasSpecs) {
    const match = findAllowedText(item?.specs, dims.specs);
    if (!match) {
      return {
        ok: false,
        message: `Specs must be one of: ${dims.specs.join(', ')}`,
      };
    }
    payload.specs = match;
  }

  if (dims.hasSubjects) {
    const match = findAllowedText(item?.subject, dims.subjects);
    if (!match) {
      return {
        ok: false,
        message: `Subject must be one of: ${dims.subjects.join(', ')}`,
      };
    }
    payload.subject = match;
  }

  const changed =
    fieldChanged(item?.productName, payload.productName) ||
    fieldChanged(item?.category, payload.category) ||
    fieldChanged(item?.level, payload.level) ||
    fieldChanged(item?.specs, payload.specs) ||
    fieldChanged(item?.subject, payload.subject) ||
    fieldChanged(item?.class, payload.class);

  return { ok: true, payload, changed, dims };
}

function evaluateWarehouseItem(item, product) {
  if (!product) {
    return { action: 'delete', reason: 'Product is not in Product Master' };
  }
  const applied = applyInventoryToProductMaster(item, product);
  if (!applied.ok) {
    return { action: 'delete', reason: applied.message };
  }
  if (applied.changed) {
    return { action: 'update', payload: applied.payload, reason: 'Aligned to Product Master' };
  }
  return { action: 'keep', payload: applied.payload };
}

async function loadProductIndex() {
  const products = await Product.find({}).select(
    'productName productLevels hasSubjects subjects hasSpecs specs hasCategory categories prodStatus'
  );
  const byName = new Map();
  for (const product of products) {
    const key = productKey(product.productName);
    if (key) byName.set(key, product);
  }
  return { products, byName };
}

function findProductForItem(item, byName) {
  return byName.get(productKey(item?.productName || item?.product || item?.product_name));
}

function isValidWarehouseItem(item, byName) {
  const product = findProductForItem(item, byName);
  return evaluateWarehouseItem(item, product).action !== 'delete';
}

function filterWarehouseItemsToProductMaster(items, byName) {
  return (Array.isArray(items) ? items : []).filter((item) => isValidWarehouseItem(item, byName));
}

async function cleanWarehouseToProductMaster() {
  const { products, byName } = await loadProductIndex();
  if (!products.length) {
    return { skipped: true, deleted: 0, updated: 0, kept: 0 };
  }

  const items = await Warehouse.find({}).sort({ createdAt: 1 });
  const toDelete = [];
  const toUpdate = [];
  let kept = 0;

  for (const item of items) {
    const product = findProductForItem(item, byName);
    const result = evaluateWarehouseItem(item, product);
    if (result.action === 'delete') {
      toDelete.push(item._id);
    } else if (result.action === 'update') {
      toUpdate.push({ id: item._id, payload: result.payload });
    } else {
      kept += 1;
    }
  }

  for (const row of toUpdate) {
    await Warehouse.updateOne(
      { _id: row.id },
      {
        $set: {
          productName: row.payload.productName,
          category: row.payload.category,
          level: row.payload.level,
          specs: row.payload.specs,
          subject: row.payload.subject,
          class: row.payload.class,
        },
      }
    );
  }

  if (toDelete.length) {
    await StockMovement.deleteMany({ productId: { $in: toDelete } });
    await Warehouse.deleteMany({ _id: { $in: toDelete } });
  }

  return {
    skipped: false,
    deleted: toDelete.length,
    updated: toUpdate.length,
    kept,
  };
}

let aligning = null;
async function ensureInventoryMatchesProductMaster() {
  if (!aligning) {
    aligning = cleanWarehouseToProductMaster().finally(() => {
      aligning = null;
    });
  }
  return aligning;
}

async function ensureWarehouseInventoryIntegrity() {
  const result = await ensureInventoryMatchesProductMaster();
  await ensureDuplicatesConsolidated();
  return result;
}

async function sanitizeWarehousePayload(body) {
  const name = String(body?.productName || body?.product || body?.product_name || '').trim();
  if (!name) {
    return { ok: false, message: 'Product is required' };
  }

  const product = await Product.findOne({
    productName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (!product) {
    return { ok: false, message: 'Product is not in Product Master' };
  }

  const applied = applyInventoryToProductMaster(body, product);
  if (!applied.ok) return applied;

  const next = { ...(body || {}) };
  next.productName = applied.payload.productName;
  next.category = applied.payload.category;
  next.level = applied.payload.level;
  next.specs = applied.payload.specs;
  next.subject = applied.payload.subject;
  next.class = applied.payload.class;
  return { ok: true, payload: next };
}

module.exports = {
  asStringArray,
  catalogDimensions,
  applyInventoryToProductMaster,
  evaluateWarehouseItem,
  loadProductIndex,
  findProductForItem,
  isValidWarehouseItem,
  filterWarehouseItemsToProductMaster,
  cleanWarehouseToProductMaster,
  ensureInventoryMatchesProductMaster,
  ensureWarehouseInventoryIntegrity,
  sanitizeWarehousePayload,
};
