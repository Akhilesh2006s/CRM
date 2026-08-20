const test = require('node:test');
const assert = require('node:assert/strict');

function blankPoPart(value) {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s || s === '-' || s === 'n/a' || s === 'na') return '';
  return s;
}

function poRowCompositeKey(p) {
  const product = blankPoPart(p.product || p.productName || p.product_name);
  const klass = blankPoPart(p.class);
  const subject = blankPoPart(p.subject);
  const level = blankPoPart(p.level);
  return [product, klass, subject, level].join('|');
}

function productClassLevelKey(p) {
  return [
    blankPoPart(p.product || p.productName || p.product_name),
    blankPoPart(p.class),
    blankPoPart(p.level),
  ].join('|');
}

function productClassBaseKey(p) {
  return [
    blankPoPart(p.product || p.productName || p.product_name),
    blankPoPart(p.class),
    blankPoPart(p.subject),
  ].join('|');
}

function hasUsableProductLevel(level) {
  const s = String(level ?? '').trim();
  return Boolean(s && s !== '-');
}

function dedupeSavedPoRows(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter(
    (p) => p && (p.product || p.productName || p.product_name)
  );

  const hasSplitSubject = new Set();
  const hasFilledLevel = new Set();
  for (const row of list) {
    if (blankPoPart(row.subject)) hasSplitSubject.add(productClassLevelKey(row));
    if (hasUsableProductLevel(row.level)) hasFilledLevel.add(productClassBaseKey(row));
  }

  const filtered = list.filter((row) => {
    if (!blankPoPart(row.subject) && hasSplitSubject.has(productClassLevelKey(row))) return false;
    if (!hasUsableProductLevel(row.level) && hasFilledLevel.has(productClassBaseKey(row))) return false;
    return true;
  });

  const seen = new Set();
  const out = [];
  for (const row of filtered) {
    const key = poRowCompositeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function qty(rows) {
  return rows.reduce((s, r) => s + (Number(r.strength) || Number(r.quantity) || 0), 0);
}

const editPo = [
  { product: 'P1', class: '1', quantity: 10, strength: 10, specs: 'workbook', price: 100 },
  { product: 'P1', class: '2', quantity: 10, strength: 10, specs: 'workbook', price: 100 },
  { product: 'P2', class: '1', subject: 'Physics', quantity: 10, strength: 10, price: 100 },
  { product: 'P2', class: '1', subject: 'Math', quantity: 10, strength: 10, price: 100 },
  { product: 'P2', class: '2', subject: 'Physics', quantity: 10, strength: 10, price: 100 },
  { product: 'P2', class: '2', subject: 'Math', quantity: 10, strength: 10, price: 100 },
  { product: 'P3', class: '1', level: 'Level 1', quantity: 10, strength: 10, price: 100 },
];

test('acceptance: Request DC keeps 7 Edit PO rows totaling 70', () => {
  const mixed = [
    ...editPo,
    { product: 'P2', class: '1', subject: '', quantity: 10, strength: 10, specs: 'Regular' },
    { product: 'P2', class: '2', subject: '', quantity: 10, strength: 10, specs: 'Regular' },
  ];
  const rows = dedupeSavedPoRows(mixed);
  assert.equal(rows.length, 7);
  assert.equal(qty(rows), 70);
  assert.equal(new Set(rows.map(poRowCompositeKey)).size, 7);
});

test('duplicate P2 with different specs still collapses to the PO composite key', () => {
  const rows = dedupeSavedPoRows([
    { product: 'P2', class: '1', subject: 'Physics', quantity: 10, specs: 'Regular' },
    { product: 'P2', class: '1', subject: 'Physics', quantity: 10, specs: '' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 10);
});

test('P2 class+subject combinations stay distinct', () => {
  const rows = dedupeSavedPoRows(editPo.filter((r) => r.product === 'P2'));
  assert.equal(rows.length, 4);
});
