const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inventoryIdentityKey,
  itemsHaveSameInventoryIdentity,
  findMatchingInventoryItems,
  groupItemsByInventoryIdentity,
} = require('../utils/warehouseInventoryIdentity');

test('null, undefined, empty string, and "-" are the same missing value', () => {
  const a = { productName: 'P1', category: 'workbook', level: null, specs: 'Regular', subject: '', itemType: 'Question Paper' };
  const b = { productName: 'P1', category: 'workbook', level: '-', specs: 'Regular', subject: undefined, itemType: 'Question Paper' };
  assert.equal(itemsHaveSameInventoryIdentity(a, b), true);
});

test('same identity keys for P1 Question Paper variants', () => {
  assert.equal(
    inventoryIdentityKey({ productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper' }),
    inventoryIdentityKey({ productName: 'p1', category: 'workbook', specs: '', itemType: 'Question Paper', level: '-' })
  );
});

test('Question Paper and Books stay separate', () => {
  const paper = { productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper' };
  const books = { productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Books' };
  assert.equal(itemsHaveSameInventoryIdentity(paper, books), false);
});

test('Level 1 and Level 2 stay separate', () => {
  const l1 = { productName: 'P3', category: 'x', level: 'Level 1', itemType: 'Question Paper' };
  const l2 = { productName: 'P3', category: 'x', level: 'Level 2', itemType: 'Question Paper' };
  assert.equal(itemsHaveSameInventoryIdentity(l1, l2), false);
});

test('Math and Physics stay separate', () => {
  const math = { productName: 'P2', subject: 'math', itemType: 'Books' };
  const phy = { productName: 'P2', subject: 'Physics', itemType: 'Books' };
  assert.equal(itemsHaveSameInventoryIdentity(math, phy), false);
});

test('different specs stay separate', () => {
  const regular = { productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper' };
  const single = { productName: 'P1', category: 'workbook', specs: 'Single Level only', itemType: 'Question Paper' };
  assert.equal(itemsHaveSameInventoryIdentity(regular, single), false);
});

test('different vendors stay separate', () => {
  const v1 = { productName: 'P1', category: 'workbook', itemType: 'Books', supplier: 'Vendor 1' };
  const v2 = { productName: 'P1', category: 'workbook', itemType: 'Books', vendor: 'Vendor 2' };
  assert.equal(itemsHaveSameInventoryIdentity(v1, v2), false);
});

test('findMatchingInventoryItems returns oldest matching row only among equals', () => {
  const items = [
    { _id: 'new', productName: 'P1', category: 'workbook', itemType: 'Question Paper', specs: 'Regular', createdAt: '2026-08-02' },
    { _id: 'old', productName: 'P1', category: 'workbook', itemType: 'Question Paper', specs: 'Regular', createdAt: '2026-08-01' },
    { _id: 'books', productName: 'P1', category: 'workbook', itemType: 'Books', specs: 'Regular', createdAt: '2026-08-01' },
  ];
  const matches = findMatchingInventoryItems(items, {
    productName: 'P1',
    category: 'workbook',
    itemType: 'Question Paper',
    specs: 'Regular',
    level: '-',
  });
  assert.equal(matches.length, 2);
  assert.equal(matches[0]._id, 'old');
  assert.equal(matches[1]._id, 'new');
});

test('two P1 Question Paper rows with empty class/level/subject/vendor are the same identity', () => {
  const a = {
    productName: 'P1',
    class: '-',
    category: 'workbook',
    level: '-',
    specs: 'Regular',
    subject: '-',
    itemType: 'Question Paper',
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
    itemType: 'Question Paper',
    vendor: '',
    currentStock: 10,
  };
  assert.equal(itemsHaveSameInventoryIdentity(a, b), true);
});

test('groupItemsByInventoryIdentity keeps Books, empty Item Type, and Level 1/2 separate', () => {
  const groups = groupItemsByInventoryIdentity([
    { _id: 'qp1', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper', currentStock: 10, createdAt: '2026-08-01' },
    { _id: 'qp2', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper', currentStock: 10, createdAt: '2026-08-02' },
    { _id: 'books', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Books', currentStock: 100, createdAt: '2026-08-01' },
    { _id: 'empty0', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: '', currentStock: 0, createdAt: '2026-08-01' },
    { _id: 'empty7', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: '-', currentStock: 7, createdAt: '2026-08-02' },
    { _id: 'l1', productName: 'P3', category: 'x', level: 'Level 1', itemType: 'Question Paper', currentStock: 100, createdAt: '2026-08-01' },
    { _id: 'l2', productName: 'P3', category: 'x', level: 'Level 2', itemType: 'Question Paper', currentStock: 50, createdAt: '2026-08-01' },
  ]);
  const qp = [...groups.values()].find((g) => g[0].productName === 'P1' && g[0].itemType === 'Question Paper');
  const books = [...groups.values()].find((g) => g[0].itemType === 'Books');
  const emptyType = [...groups.values()].find((g) => g[0].productName === 'P1' && (!g[0].itemType || g[0].itemType === '-'));
  const p3Groups = [...groups.values()].filter((g) => g[0].productName === 'P3');
  assert.equal(qp.length, 2);
  assert.equal(qp[0]._id, 'qp1');
  assert.equal(books.length, 1);
  assert.equal(emptyType.length, 2);
  assert.equal(p3Groups.length, 2);
});

test('two identical P1 Question Paper rows of 10 combine to quantity 20', () => {
  const groups = groupItemsByInventoryIdentity([
    { _id: 'a', productName: 'P1', class: '-', category: 'workbook', level: '-', specs: 'Regular', subject: '-', itemType: 'Question Paper', supplier: '-', currentStock: 10, createdAt: '2026-08-01' },
    { _id: 'b', productName: 'P1', class: null, category: 'workbook', level: '', specs: 'Regular', subject: null, itemType: 'Question Paper', vendor: '', currentStock: 10, createdAt: '2026-08-02' },
  ]);
  const qp = [...groups.values()][0];
  assert.equal(qp.length, 2);
  assert.equal(qp.reduce((s, r) => s + r.currentStock, 0), 20);
});
