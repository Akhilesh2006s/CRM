const test = require('node:test');
const assert = require('node:assert/strict');
const {
  productLineIdentity,
  orderProductToDcDetail,
  dcDetailToOrderProduct,
  filterOutExactTermWiseLines,
  filterOutTermWiseCompanions,
  sumProductQuantities,
  sumProductAmounts,
  keepMyClientsOwnedProductRows,
  isSecondStageLine,
  rowUnitPrice,
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

test('empty-level grouped leftover is stripped when Term-Wise has Level 2 same class', () => {
  const tw = [{ product: 'p3', class: '1', level: 'Level 2', term: 'Term 2', quantity: 10 }];
  const incoming = [
    { product: 'P1', class: '1', quantity: 20 },
    { product: 'P1', class: '2', quantity: 20 },
    { product: 'P2', class: '1', subject: 'math', quantity: 10 },
    { product: 'P2', class: '1', subject: 'Phy', quantity: 10 },
    { product: 'P2', class: '2', subject: 'math', quantity: 10 },
    { product: 'P2', class: '2', subject: 'Phy', quantity: 10 },
    { product: 'p3', class: '1', level: 'Level 1', term: 'Term 1', quantity: 10 },
    { product: 'p3', class: '1', quantity: 10 },
  ];
  const kept = filterOutTermWiseCompanions(incoming, tw);
  assert.equal(kept.length, 7);
  assert.equal(sumProductQuantities(kept), 90);
  assert.ok(kept.some((p) => String(p.level || '') === 'Level 1'));
  assert.equal(
    kept.filter((p) => String(p.product).toLowerCase() === 'p3').length,
    1
  );
});

test('empty-level P1 rows are kept when Term-Wise companion is a different product', () => {
  const tw = [{ product: 'p3', class: '1', level: 'Level 2', quantity: 10 }];
  const incoming = [
    { product: 'P1', class: '1', quantity: 20 },
    { product: 'P1', class: '2', quantity: 20 },
    { product: 'p3', class: '1', level: 'Level 1', quantity: 10 },
  ];
  const kept = filterOutTermWiseCompanions(incoming, tw);
  assert.equal(kept.length, 3);
  assert.equal(sumProductQuantities(kept), 50);
});

const exampleMyClientsPlusTermWise = [
  { product: 'P1', class: '1', quantity: 20, level: 'Class 1', term: 'Term 1' },
  { product: 'P1', class: '2', quantity: 20, level: 'Class 2', term: 'Term 1' },
  { product: 'P2', class: '1', subject: 'math', quantity: 10, term: 'Term 1' },
  { product: 'P2', class: '1', subject: 'Phy', quantity: 10, term: 'Term 1' },
  { product: 'P2', class: '2', subject: 'math', quantity: 10, term: 'Term 1' },
  { product: 'P2', class: '2', subject: 'Phy', quantity: 10, term: 'Term 1' },
  { product: 'p3', class: '1', level: 'Level 1', term: 'Term 1', quantity: 10 },
  { product: 'p3', class: '1', level: 'Level 2', term: 'Term 2', quantity: 10 },
];

test('paired Level 2 is dropped from My Clients even without sibling rows', () => {
  const kept = keepMyClientsOwnedProductRows(exampleMyClientsPlusTermWise, []);
  assert.equal(kept.length, 7);
  assert.equal(sumProductQuantities(kept), 90);
  assert.equal(
    kept.filter((p) => String(p.product).toLowerCase() === 'p3').length,
    1
  );
  assert.ok(kept.some((p) => String(p.level || '') === 'Level 1'));
  assert.equal(
    kept.filter((p) => String(p.level || '') === 'Level 2').length,
    0
  );
});

test('sibling Term-Wise rows also strip the matching later-stage allocation', () => {
  const tw = [{ product: 'p3', class: '1', level: 'Level 2', term: 'Term 2', quantity: 10 }];
  const kept = keepMyClientsOwnedProductRows(exampleMyClientsPlusTermWise, tw);
  assert.equal(kept.length, 7);
  assert.equal(sumProductQuantities(kept), 90);
});

test('Closed Sales Raise DC total is My Clients 90, not merged 110', () => {
  const myClients = [
    { product: 'P1', class: '1', quantity: 20, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'P1', class: '2', quantity: 20, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'P2', class: '1', subject: 'Phy', quantity: 10, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'P2', class: '1', subject: 'math', quantity: 10, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'P2', class: '2', subject: 'Phy', quantity: 10, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'P2', class: '2', subject: 'math', quantity: 10, term: 'Term 1', closeLeadDestination: 'MY_CLIENT' },
    { product: 'p3', class: '1', level: 'Level 1', term: 'Term 1', quantity: 10, closeLeadDestination: 'MY_CLIENT' },
  ]
  const termWise = [
    {
      product: 'p3',
      class: '1',
      level: 'Level 2',
      term: 'Term 2',
      quantity: 20,
      closeLeadDestination: 'TERM_WISE_DC',
    },
  ]
  const merged = [...myClients, ...termWise]
  const kept = keepMyClientsOwnedProductRows(merged, termWise)
  assert.equal(sumProductQuantities(merged), 110)
  assert.equal(sumProductQuantities(kept), 90)
  assert.equal(
    kept.filter((p) => String(p.level || '') === 'Level 2').length,
    0
  )
})

test('Term-2-only product on My Clients is kept when it has no Level 1 pair', () => {
  const onlyLaterStage = [
    { product: 'P4', class: '1', level: 'Level 2', term: 'Term 2', quantity: 10 },
  ];
  const kept = keepMyClientsOwnedProductRows(onlyLaterStage, []);
  assert.equal(kept.length, 1);
  assert.equal(sumProductQuantities(kept), 10);
  assert.equal(isSecondStageLine(kept[0]), true);
});

test('rowUnitPrice prefers a positive price when unit_price is 0', () => {
  assert.equal(rowUnitPrice({ unit_price: 10, price: 0 }), 10);
  assert.equal(rowUnitPrice({ unit_price: 0, price: 10 }), 10);
  assert.equal(rowUnitPrice({ price: 10.5 }), 10.5);
  assert.equal(rowUnitPrice({ unit_price: 99.99 }), 99.99);
});

test('orderProductToDcDetail writes unit_price and total = unit_price × quantity', () => {
  const detail = orderProductToDcDetail({
    product_name: 'P6',
    quantity: 10,
    unit_price: 10,
  });
  assert.equal(detail.unit_price, 10);
  assert.equal(detail.price, 10);
  assert.equal(detail.quantity, 10);
  assert.equal(detail.total, 100);
});
