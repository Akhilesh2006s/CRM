const test = require('node:test');
const assert = require('node:assert/strict');
const {
  productLineIdentity,
  orderProductToDcDetail,
  dcDetailToOrderProduct,
  filterOutExactTermWiseLines,
  sumProductQuantities,
  sumProductAmounts,
} = require('../utils/productLineIdentity');

function line(product_name, klass, subject, quantity, unit_price = 10) {
  const row = { product_name, quantity, unit_price };
  row.class = String(klass);
  if (subject) row.subject = subject;
  return row;
}

const p2Rows = [
  line('P2', 1, 'Physics', 10),
  line('P2', 1, 'Maths', 10),
  line('P2', 2, 'Physics', 10),
  line('P2', 2, 'Maths', 10),
];

test('P2 class+subject combinations have distinct identity keys', () => {
  const keys = p2Rows.map((p) => productLineIdentity(p));
  assert.equal(new Set(keys).size, 4);
});

test('example PO keeps 7 distinct rows (P1x2 + P2x4 + P4)', () => {
  const rows = [
    line('P1', 1, '', 20),
    line('P1', 2, '', 20),
    ...p2Rows.map((p) => ({ ...p })),
    line('P4', 1, '', 5),
  ];
  assert.equal(rows.length, 7);
  assert.equal(new Set(rows.map((p) => productLineIdentity(p))).size, 7);
  assert.equal(sumProductQuantities(rows), 85);
  assert.equal(sumProductAmounts(rows), 850);
});

test('unsplit P2 class rows do not share identity with split subject rows', () => {
  const unsplit = line('P2', 1, '', 20);
  const physics = p2Rows[0];
  assert.notEqual(productLineIdentity(unsplit), productLineIdentity(physics));
});

test('orderProductToDcDetail preserves class, subject, and lineId', () => {
  const detail = orderProductToDcDetail({
    ...p2Rows[1],
    lineId: 'line-c1-maths',
  });
  assert.equal(detail.class, '1');
  assert.equal(detail.subject, 'Maths');
  assert.equal(detail.quantity, 10);
  assert.equal(detail.lineId, 'line-c1-maths');
});

test('dcDetailToOrderProduct does not copy another row subject via name-only', () => {
  const existing = p2Rows.map((p, i) => ({ ...p, lineId: `id-${i}` }));
  const converted = dcDetailToOrderProduct(
    { product: 'P2', class: '1', subject: 'Physics', quantity: 10, unit_price: 10 },
    existing
  );
  assert.equal(converted.subject, 'Physics');
  assert.equal(converted.class, '1');
});

test('term-wise filter does not drop P2 subject rows', () => {
  const tw = [{ product: 'P3', class: '1', level: 'Level 2', quantity: 5 }];
  const incoming = [
    line('P1', 1, '', 20),
    line('P1', 2, '', 20),
    line('P2', 1, 'Physics', 10),
    line('P2', 1, 'Maths', 10),
    line('P2', 2, 'Physics', 10),
    line('P2', 2, 'Maths', 10),
    line('P4', 1, '', 5),
  ];
  const kept = filterOutExactTermWiseLines(incoming, tw);
  assert.equal(kept.length, 7);
  assert.equal(sumProductQuantities(kept), 85);
});
