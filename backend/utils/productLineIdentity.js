const { getRowStageFlags, persistProductTerm, partitionProductsForCloseLeadRouting } = require('./productTerm');

/** Identity for a product LINE (name + level + class + specs + category + subject + term). Never name-only. */
function productLineIdentity(p) {
  if (!p || typeof p !== 'object') return '';
  const name = String(p.product || p.productName || p.product_name || '')
    .trim()
    .toLowerCase();
  const level = String(p.level || '')
    .trim()
    .toLowerCase();
  const klass = String(p.class ?? '').trim().toLowerCase();
  const specs = String(p.specs || '').trim().toLowerCase();
  const cat = String(p.productCategory || '').trim().toLowerCase();
  const subject = String(p.subject || '').trim().toLowerCase();
  const term = String(p.term || '').trim().toLowerCase();
  return [name, level, klass, specs, cat, subject, term].join('|');
}

function productNameKey(p) {
  return String(p?.product || p?.productName || p?.product_name || '')
    .trim()
    .toLowerCase();
}

function displayLevelValue(level) {
  const s = String(level ?? '').trim();
  if (!s || s === '-') return '';
  return s;
}

function productClassBaseKey(p) {
  const name = String(p?.product || p?.productName || p?.product_name || '')
    .trim()
    .toLowerCase();
  const klass = String(p?.class ?? '').trim().toLowerCase();
  const subject = String(p?.subject || '').trim().toLowerCase();
  return [name, klass, subject].join('|');
}

function ensureLineId(p) {
  const existing = String(p?.lineId || '').trim();
  if (existing) return existing;
  const id = productLineIdentity(p);
  return id.replace(/\|/g, '') ? `line:${id}` : undefined;
}

function rowQuantity(p) {
  const q = Number(p?.quantity);
  if (Number.isFinite(q) && q > 0) return q;
  const s = Number(p?.strength);
  return Number.isFinite(s) && s > 0 ? s : 0;
}

function rowUnitPrice(p) {
  const u = Number(p?.unit_price);
  if (Number.isFinite(u)) return u;
  return Number(p?.price) || 0;
}

function sumProductQuantities(products) {
  return (products || []).reduce((sum, p) => sum + rowQuantity(p), 0);
}

function sumProductAmounts(products) {
  return (products || []).reduce((sum, p) => {
    const qty = rowQuantity(p);
    const price = rowUnitPrice(p);
    const stored = Number(p?.total);
    return sum + (Number.isFinite(stored) && stored > 0 ? stored : qty * price);
  }, 0);
}

/** Drop only lines that exactly match a Term-Wise sibling. Never drop newly added PO products. */
function filterOutExactTermWiseLines(rows, siblingRows) {
  const twKeys = new Set(
    (siblingRows || []).map((p) => productLineIdentity(p)).filter(Boolean)
  );
  return (rows || []).filter((p) => !twKeys.has(productLineIdentity(p)));
}

function orderProductToDcDetail(p) {
  const name = p.product_name || p.product || p.productName || '';
  const qty = rowQuantity(p);
  const price = rowUnitPrice(p);
  const strength = Number(p.strength) || qty;
  const level = displayLevelValue(p.level);
  const storedTotal = Number(p.total);
  return {
    product: name,
    productName: name,
    class: p.class != null && String(p.class).trim() !== '' ? String(p.class).trim() : '1',
    category: p.category,
    productCategory: p.productCategory,
    specs: p.specs,
    subject: p.subject,
    quantity: qty,
    strength,
    price,
    unit_price: price,
    total: Number.isFinite(storedTotal) && storedTotal > 0 ? storedTotal : qty * price,
    level,
    term: persistProductTerm({ ...p, level }),
    closeLeadDestination: p.closeLeadDestination,
    selected_subjects: Array.isArray(p.selected_subjects) ? p.selected_subjects : undefined,
    deliverables: Array.isArray(p.deliverables) ? p.deliverables : undefined,
    lineId: ensureLineId(p),
  };
}

function dcDetailToOrderProduct(p, existing = []) {
  const key = productLineIdentity(p);
  const prev = (existing || []).find((o) => productLineIdentity(o) === key);
  const qty = rowQuantity(p) || rowQuantity(prev);
  const price = rowUnitPrice(p) || rowUnitPrice(prev);
  const storedTotal = Number(p.total);
  return {
    product_name: p.product || p.productName || p.product_name || prev?.product_name || '',
    quantity: qty,
    unit_price: price,
    total: Number.isFinite(storedTotal) && storedTotal > 0 ? storedTotal : qty * price,
    class: p.class || prev?.class,
    specs: p.specs || prev?.specs,
    productCategory: p.productCategory || prev?.productCategory,
    category: p.category || prev?.category,
    strength: Number(p.strength) || qty || prev?.strength || 0,
    level: displayLevelValue(p.level || prev?.level),
    term: persistProductTerm({ ...prev, ...p }),
    subject: p.subject || prev?.subject,
    selected_subjects: Array.isArray(p.selected_subjects)
      ? p.selected_subjects
      : prev?.selected_subjects,
    deliverables: Array.isArray(p.deliverables) ? p.deliverables : prev?.deliverables,
    closeLeadDestination: p.closeLeadDestination || prev?.closeLeadDestination,
    lineId: ensureLineId({ ...prev, ...p, lineId: p.lineId || prev?.lineId }),
  };
}

function isSecondStageLine(row) {
  const f = getRowStageFlags(row);
  if (f.isLevel2 || f.isTerm2) return true;
  const k = String(row?.level ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  return k === 'l2' || k === 'lvl2';
}

function lineMatchesTermWiseCompanion(row, siblingRows) {
  const key = productLineIdentity(row);
  if ((siblingRows || []).some((s) => productLineIdentity(s) === key)) return true;
  const name = productNameKey(row);
  if (!name) return false;
  if (isSecondStageLine(row)) {
    return (siblingRows || []).some((s) => {
      if (productNameKey(s) !== name) return false;
      return isSecondStageLine(s);
    });
  }
  // Grouped leftover with level dropped (Level "-") still belongs on Term-Wise
  // when a sibling second-stage line has the same product+class.
  if (!displayLevelValue(row?.level)) {
    const classKey = productClassBaseKey(row);
    return (siblingRows || []).some(
      (s) => isSecondStageLine(s) && productClassBaseKey(s) === classKey
    );
  }
  return false;
}

async function siblingTermWiseRows(DC, dcOrderId, excludeDcId) {
  if (!dcOrderId) return [];
  const query = { dcOrderId, status: 'scheduled_for_later' };
  if (excludeDcId) query._id = { $ne: excludeDcId };
  const siblings = await DC.find(query).select('productDetails status').lean();
  const rows = [];
  for (const s of siblings || []) {
    for (const p of s.productDetails || []) {
      rows.push(typeof p.toObject === 'function' ? p.toObject() : { ...p });
    }
  }
  return rows;
}

function filterOutTermWiseCompanions(rows, siblingRows) {
  return (rows || []).filter((p) => !lineMatchesTermWiseCompanion(p, siblingRows));
}

/**
 * Rows that belong on this My Clients / Term 1 DC.
 * Strips sibling Term-Wise allocations and paired later-stage lines
 * on the same list (Level 1+2 or Term 1+2 of the same product).
 */
function keepMyClientsOwnedProductRows(rows, siblingRows) {
  const withoutSiblings = filterOutTermWiseCompanions(rows, siblingRows);
  const { myClientsProducts } = partitionProductsForCloseLeadRouting(withoutSiblings);
  return myClientsProducts;
}

function logDcProductAssoc(label, extra = {}) {
  const rows = extra.rows || extra.productDetails || [];
  console.log(`[DC-ASSOC] ${label}`, {
    dcId: extra.dcId,
    orderId: extra.orderId,
    count: rows.length,
    total: sumProductQuantities(rows),
    lines: rows.map((p) => ({
      product: p.product || p.productName || p.product_name,
      productId: p.productId,
      lineId: p.lineId,
      level: p.level,
      term: p.term,
      quantity: rowQuantity(p),
      closeLeadDestination: p.closeLeadDestination,
    })),
  });
}

/**
 * My Clients Edit PO must not replace Term-Wise lines on the shared DcOrder.
 * Incoming rows are this DC only; Term-Wise rows stay from the sibling DC (or existing order).
 */
function mergeMyClientsProductsPreservingTermWise(
  incomingProducts,
  existingProducts,
  termWiseDetailRows
) {
  const incoming = Array.isArray(incomingProducts) ? incomingProducts : [];
  const existing = Array.isArray(existingProducts) ? existingProducts : [];
  const twDetails = Array.isArray(termWiseDetailRows) ? termWiseDetailRows : [];

  const termWiseFromDc = twDetails.map((p) => dcDetailToOrderProduct(p, existing));
  const myClients = incoming.filter((p) => {
    const detail = orderProductToDcDetail(p);
    return !lineMatchesTermWiseCompanion(detail, twDetails);
  });

  const keptTw =
    termWiseFromDc.length > 0
      ? termWiseFromDc
      : existing.filter((p) =>
          lineMatchesTermWiseCompanion(orderProductToDcDetail(p), twDetails)
        );

  return [...myClients, ...keptTw];
}

/**
 * Term-Wise Edit PO must not replace My Clients lines on the shared DcOrder.
 */
function mergeTermWiseProductsPreservingMyClients(
  incomingProducts,
  existingProducts,
  termWiseDetailRows
) {
  const incoming = Array.isArray(incomingProducts) ? incomingProducts : [];
  const existing = Array.isArray(existingProducts) ? existingProducts : [];
  const twDetails = Array.isArray(termWiseDetailRows) ? termWiseDetailRows : [];
  const incomingAsDetails =
    twDetails.length > 0 ? twDetails : incoming.map((p) => orderProductToDcDetail(p));

  const incomingTw = incoming.map((p) => dcDetailToOrderProduct(p, existing));
  const myClients = existing.filter((p) => {
    const detail = orderProductToDcDetail(p);
    return !lineMatchesTermWiseCompanion(detail, incomingAsDetails);
  });
  const keptTw =
    incomingTw.length > 0
      ? incomingTw
      : existing.filter((p) =>
          lineMatchesTermWiseCompanion(orderProductToDcDetail(p), incomingAsDetails)
        );

  return [...myClients, ...keptTw];
}

module.exports = {
  productLineIdentity,
  productNameKey,
  displayLevelValue,
  orderProductToDcDetail,
  dcDetailToOrderProduct,
  lineMatchesTermWiseCompanion,
  siblingTermWiseRows,
  filterOutTermWiseCompanions,
  filterOutExactTermWiseLines,
  keepMyClientsOwnedProductRows,
  mergeMyClientsProductsPreservingTermWise,
  mergeTermWiseProductsPreservingMyClients,
  isSecondStageLine,
  sumProductQuantities,
  sumProductAmounts,
  logDcProductAssoc,
};
