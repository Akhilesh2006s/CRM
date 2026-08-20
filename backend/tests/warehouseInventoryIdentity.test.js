const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inventoryIdentityKey,
  itemsHaveSameInventoryIdentity,
  findMatchingInventoryItems,
  groupItemsByInventoryIdentity,
  hasAssignedVendor,
  consolidatedStockList,
  warehouseDocsForStockRow,
} = require('../utils/warehouseInventoryIdentity');

test('null, undefined, empty string, and "-" are the same missing value', () => {
  const a = { productName: 'P1', category: 'workbook', level: null, specs: 'Regular', subject: '' };
  const b = { productName: 'P1', category: 'workbook', level: '-', specs: 'Regular', subject: undefined };
  assert.equal(itemsHaveSameInventoryIdentity(a, b), true);
});

test('same identity keys for P1 variants with equivalent blank fields', () => {
  assert.equal(
    inventoryIdentityKey({ productName: 'P1', category: 'workbook', specs: 'Regular' }),
    inventoryIdentityKey({ productName: 'p1', category: 'workbook', specs: '', level: '-' })
  );
});

test('Books and Question Paper with the same product identity are the same SKU', () => {
  const paper = { productName: 'P1', category: 'workbook', specs: 'Regular' };
  const books = { productName: 'P1', category: 'workbook', specs: 'Regular' };
  assert.equal(itemsHaveSameInventoryIdentity(paper, books), true);
});

test('Level 1 and Level 2 stay separate', () => {
  const l1 = { productName: 'P3', category: 'x', level: 'Level 1' };
  const l2 = { productName: 'P3', category: 'x', level: 'Level 2' };
  assert.equal(itemsHaveSameInventoryIdentity(l1, l2), false);
});

test('Math and Physics stay separate', () => {
  const math = { productName: 'P2', subject: 'math' };
  const phy = { productName: 'P2', subject: 'Physics' };
  assert.equal(itemsHaveSameInventoryIdentity(math, phy), false);
});

test('different specs stay separate', () => {
  const regular = { productName: 'P1', category: 'workbook', specs: 'Regular' };
  const single = { productName: 'P1', category: 'workbook', specs: 'Single Level only' };
  assert.equal(itemsHaveSameInventoryIdentity(regular, single), false);
});

test('different vendors stay separate', () => {
  const v1 = { productName: 'P1', category: 'workbook', supplier: 'Vendor 1' };
  const v2 = { productName: 'P1', category: 'workbook', vendor: 'Vendor 2' };
  assert.equal(itemsHaveSameInventoryIdentity(v1, v2), false);
});

test('findMatchingInventoryItems returns oldest matching row first among equals', () => {
  const items = [
    { _id: 'new', productName: 'P1', category: 'workbook', specs: 'Regular', createdAt: '2026-08-02' },
    { _id: 'old', productName: 'P1', category: 'workbook', specs: 'Regular', createdAt: '2026-08-01' },
    { _id: 'other', productName: 'P1', category: 'workbook', specs: 'Regular', createdAt: '2026-08-01' },
  ];
  const matches = findMatchingInventoryItems(items, {
    productName: 'P1',
    category: 'workbook',
    specs: 'Regular',
    level: '-',
  });
  assert.equal(matches.length, 3);
  assert.equal(matches[0]._id, 'old');
});

test('two P1 rows with empty class/level/subject/vendor are the same identity', () => {
  const a = {
    productName: 'P1',
    class: '-',
    category: 'workbook',
    level: '-',
    specs: 'Regular',
    subject: '-',
    supplier: '-',
    currentStock: 10,
  };
  const b = {
    productName: 'P1',
    class: null,
    category: 'workbook',
    level: '',
    specs: 'Regular',
    subject: null,
    vendor: '',
    currentStock: 10,
  };
  assert.equal(itemsHaveSameInventoryIdentity(a, b), true);
});

test('groupItemsByInventoryIdentity merges same 5-field SKUs and keeps Level 1/2 separate', () => {
  const groups = groupItemsByInventoryIdentity([
    { _id: 'a1', productName: 'P1', category: 'workbook', specs: 'Regular', currentStock: 10, createdAt: '2026-08-01' },
    { _id: 'a2', productName: 'P1', category: 'workbook', specs: 'Regular', currentStock: 10, createdAt: '2026-08-02' },
    { _id: 'a3', productName: 'P1', category: 'workbook', specs: 'Regular', currentStock: 100, createdAt: '2026-08-01' },
    { _id: 'l1', productName: 'P3', category: 'x', level: 'Level 1', currentStock: 100, createdAt: '2026-08-01' },
    { _id: 'l2', productName: 'P3', category: 'x', level: 'Level 2', currentStock: 50, createdAt: '2026-08-01' },
  ]);
  const p1 = [...groups.values()].find((g) => g[0].productName === 'P1');
  const p3Groups = [...groups.values()].filter((g) => g[0].productName === 'P3');
  assert.equal(p1.length, 3);
  assert.equal(p1[0]._id, 'a1');
  assert.equal(p3Groups.length, 2);
});

test('two identical P1 rows of 10 combine to quantity 20', () => {
  const groups = groupItemsByInventoryIdentity([
    { _id: 'a', productName: 'P1', class: '-', category: 'workbook', level: '-', specs: 'Regular', subject: '-', supplier: '-', currentStock: 10, createdAt: '2026-08-01' },
    { _id: 'b', productName: 'P1', class: null, category: 'workbook', level: '', specs: 'Regular', subject: null, vendor: '', currentStock: 10, createdAt: '2026-08-02' },
  ]);
  const group = [...groups.values()][0];
  assert.equal(group.length, 2);
  assert.equal(group.reduce((s, r) => s + r.currentStock, 0), 20);
});

test('hasAssignedVendor hides empty, dash, and missing vendor values', () => {
  assert.equal(hasAssignedVendor({ supplier: 'Vendor 1' }), true);
  assert.equal(hasAssignedVendor({ vendor: 'Vendor 1' }), true);
  assert.equal(hasAssignedVendor({ supplier: '' }), false);
  assert.equal(hasAssignedVendor({ supplier: '   ' }), false);
  assert.equal(hasAssignedVendor({ supplier: '-' }), false);
  assert.equal(hasAssignedVendor({ supplier: null }), false);
  assert.equal(hasAssignedVendor({}), false);
});

test('consolidatedStockList sums vendor quantities and ignores vendor', () => {
  const rows = consolidatedStockList([
    { _id: 'a', productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 140 },
    { _id: 'b', productName: 'P1', category: 'workbook', vendor: 'Vendor 2', currentStock: 40 },
    { _id: 'c', productName: 'P2', category: 'Physics', supplier: 'Vendor 1', currentStock: 20 },
    { _id: 'd', productName: 'P2', category: 'Physics', supplier: 'Vendor 2', currentStock: 30 },
  ]);
  const p1 = rows.find((r) => r.productName === 'P1');
  const p2 = rows.find((r) => r.productName === 'P2');
  assert.equal(rows.length, 2);
  assert.equal(p1.currentStock, 180);
  assert.equal(p1.category, 'workbook');
  assert.equal(p1.supplier, undefined);
  assert.deepEqual(p1.sourceIds.map(String).sort(), ['a', 'b']);
  assert.equal(p2.currentStock, 50);
  assert.equal(p2.category, 'Physics');
});

test('consolidatedStockList keeps different product identities separate', () => {
  const rows = consolidatedStockList([
    { productName: 'P1', category: 'workbook', level: 'Level 1', supplier: 'Vendor 1', currentStock: 10 },
    { productName: 'P1', category: 'workbook', level: 'Level 2', supplier: 'Vendor 2', currentStock: 5 },
    { productName: 'P1', category: 'workbook', subject: 'Math', supplier: 'Vendor 1', currentStock: 7 },
    { productName: 'P1', category: 'workbook', supplier: '-', currentStock: 99 },
  ]);
  assert.equal(rows.length, 3);
  const p1 = rows.filter((r) => r.productName === 'P1' && r.category === 'workbook');
  assert.equal(p1.reduce((s, r) => s + r.currentStock, 0), 22);
});

test('consolidatedStockList sums all P1 workbook vendor rows to one qty', () => {
  const rows = consolidatedStockList([
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 40, location: 'Main Warehouse' },
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 2', currentStock: 140, location: 'Main Warehouse' },
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 3', currentStock: 50, specs: 'Regular' },
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 20, specs: '-' },
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 2', currentStock: 30 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].currentStock, 280);
  assert.equal(rows[0].productName, 'P1');
  assert.equal(rows[0].category, 'workbook');
});

test('consolidatedStockList does not treat Main Warehouse as a Level', () => {
  const rows = consolidatedStockList([
    { productName: 'P4', category: 'hhhhh', supplier: 'Vendor 1', currentStock: 20, location: 'Main Warehouse' },
    { productName: 'P4', category: 'hhhhh', supplier: 'Vendor 2', currentStock: 20 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].currentStock, 40);
  assert.equal(rows[0].level, '');
});

test('stock totals match Inventory Items rows after grouping across vendors', () => {
  const inventoryItems = [
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 140 },
    { productName: 'P1', category: 'workbook', supplier: 'Vendor 2', currentStock: 40 },
    { productName: 'P2', category: 'Phy', supplier: 'Vendor 1', currentStock: 20 },
    { productName: 'P2', category: 'math', supplier: 'Vendor 1', currentStock: 20 },
    { productName: 'P3', level: 'Level 1', supplier: 'Vendor 1', currentStock: 20 },
    { productName: 'P4', category: 'hhhhh', supplier: 'Vendor 1', currentStock: 20 },
  ];
  const rows = consolidatedStockList(inventoryItems);
  const qty = Object.fromEntries(rows.map((r) => [
    `${r.productName}|${r.category || r.level}`,
    r.currentStock,
  ]));
  assert.equal(qty['P1|workbook'], 180);
  assert.equal(qty['P2|Phy'], 20);
  assert.equal(qty['P2|math'], 20);
  assert.equal(qty['P3|Level 1'], 20);
  assert.equal(qty['P4|hhhhh'], 20);
  assert.equal(rows.reduce((s, r) => s + r.currentStock, 0), 260);
});

test('warehouseDocsForStockRow deducts from the Stock group, not a leftover 0-qty SKU', () => {
  const stock = consolidatedStockList([
    { _id: 'v1', productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 140 },
    { _id: 'v2', productName: 'P1', category: 'workbook', supplier: 'Vendor 2', currentStock: 40 },
  ]);
  const allItems = [
    { _id: 'v1', productName: 'P1', category: 'workbook', supplier: 'Vendor 1', currentStock: 140 },
    { _id: 'v2', productName: 'P1', category: 'workbook', supplier: 'Vendor 2', currentStock: 40 },
    { _id: 'zero', productName: 'P1', category: 'workbook', level: 'L1', specs: 'Single Level only', supplier: 'Vendor 1', currentStock: 0 },
  ];
  const docs = warehouseDocsForStockRow(allItems, stock[0]);
  assert.deepEqual(docs.map((d) => String(d._id)).sort(), ['v1', 'v2']);
});
