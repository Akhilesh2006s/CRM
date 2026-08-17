const test = require('node:test');
const assert = require('node:assert/strict');
const {
  matchWarehouseItem,
  validateDcStockAgainstInventory,
} = require('../utils/warehouseInventoryMatch');

function inv(overrides) {
  return {
    _id: overrides._id || overrides.productName,
    productName: '',
    category: '',
    level: '',
    specs: 'Regular',
    subject: '',
    currentStock: 0,
    ...overrides,
  };
}

test('A: required 5, available 10 → submission succeeds', () => {
  const result = validateDcStockAgainstInventory(
    [{ productName: 'P1', quantity: 5, specs: 'Regular' }],
    [inv({ _id: 'p1', productName: 'P1', currentStock: 10 })]
  );
  assert.equal(result.ok, true);
  assert.equal(result.allocations.length, 1);
});

test('B: required 5, available 5 → submission succeeds', () => {
  const result = validateDcStockAgainstInventory(
    [{ productName: 'P1', quantity: 5, specs: 'Regular' }],
    [inv({ _id: 'p1', productName: 'P1', currentStock: 5 })]
  );
  assert.equal(result.ok, true);
});

test('C: required 5, available 0 → submission is blocked', () => {
  const result = validateDcStockAgainstInventory(
    [{ productName: 'P1', quantity: 5, specs: 'Regular' }],
    [inv({ _id: 'p1', productName: 'P1', currentStock: 0 })]
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /requires 5 but only 0 is available/i);
});

test('D: required 10, available 5 → submission is blocked', () => {
  const result = validateDcStockAgainstInventory(
    [{ productName: 'P1', quantity: 10, specs: 'Regular' }],
    [inv({ _id: 'p1', productName: 'P1', currentStock: 5 })]
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /requires 10 but only 5 is available/i);
});

test('E: mixed rows — one with stock and one with 0 — entire DC is blocked', () => {
  const result = validateDcStockAgainstInventory(
    [
      { productName: 'P1', quantity: 5, specs: 'Regular' },
      { product: 'P2', subject: 'Physics', quantity: 10, specs: 'Regular' },
    ],
    [
      inv({ _id: 'p1', productName: 'P1', currentStock: 10 }),
      inv({ _id: 'phy', productName: 'P2', subject: 'Physics', currentStock: 0 }),
    ]
  );
  assert.equal(result.ok, false);
  assert.equal(result.allocations.length, 0);
  assert.match(result.message, /Physics/i);
  assert.doesNotMatch(result.message, /P1 requires/);
});

test('F: Physics/Math/Chemistry with 0 stock are listed together', () => {
  const result = validateDcStockAgainstInventory(
    [
      { productName: 'P1', quantity: 5, specs: 'Regular' },
      { product: 'P2', subject: 'Physics', quantity: 10, specs: 'Regular' },
      { product: 'P2', subject: 'Math', quantity: 10, specs: 'Regular' },
      { product: 'P2', subject: 'Chemistry', quantity: 8, specs: 'Regular' },
    ],
    [
      inv({ _id: 'p1', productName: 'P1', currentStock: 10 }),
      inv({ _id: 'phy', productName: 'P2', subject: 'Physics', currentStock: 0 }),
      inv({ _id: 'math', productName: 'P2', subject: 'Math', currentStock: 0 }),
      inv({ _id: 'chem', productName: 'P2', subject: 'Chemistry', currentStock: 0 }),
    ]
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /Physics requires 10 but only 0 is available/i);
  assert.match(result.message, /Math requires 10 but only 0 is available/i);
  assert.match(result.message, /Chemistry requires 8 but only 0 is available/i);
});

test('G: Level 1 stock is not used for Level 2', () => {
  const inventory = [
    inv({ _id: 'l1', productName: 'P3', level: 'Level 1', currentStock: 99999 }),
    inv({ _id: 'l2', productName: 'P3', level: 'Level 2', currentStock: 0 }),
  ];
  const l2Row = { productName: 'P3', level: 'L2', quantity: 5, specs: 'Regular' };
  assert.equal(matchWarehouseItem(inventory, l2Row)?._id, 'l2');
  const result = validateDcStockAgainstInventory([l2Row], inventory);
  assert.equal(result.ok, false);
  assert.match(result.message, /only 0 is available/i);

  const l1Ok = validateDcStockAgainstInventory(
    [{ productName: 'P3', level: 'Level 1', quantity: 5, specs: 'Regular' }],
    inventory
  );
  assert.equal(l1Ok.ok, true);
});

test('H: Product P4 stock is not used for P1/P2/P3', () => {
  const inventory = [
    inv({ _id: 'p4', productName: 'P4', currentStock: 500 }),
    inv({ _id: 'p1', productName: 'P1', currentStock: 0 }),
  ];
  const p1Row = { productName: 'P1', quantity: 5, specs: 'Regular' };
  assert.equal(matchWarehouseItem(inventory, p1Row)?._id, 'p1');
  const result = validateDcStockAgainstInventory([p1Row], inventory);
  assert.equal(result.ok, false);
  assert.match(result.message, /P1 requires 5 but only 0 is available/i);
});

test('subject stock is independent — Physics stock does not cover Math', () => {
  const inventory = [
    inv({ _id: 'phy', productName: 'P2', subject: 'Physics', currentStock: 100 }),
    inv({ _id: 'math', productName: 'P2', subject: 'Math', currentStock: 0 }),
  ];
  const result = validateDcStockAgainstInventory(
    [{ product: 'P2', subject: 'Math', quantity: 10, specs: 'Regular' }],
    inventory
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /Math requires 10 but only 0 is available/i);
});

test('two lines sharing one SKU reserve stock cumulatively', () => {
  const result = validateDcStockAgainstInventory(
    [
      { productName: 'P1', class: '1', quantity: 8, specs: 'Regular' },
      { productName: 'P1', class: '2', quantity: 8, specs: 'Regular' },
    ],
    [inv({ _id: 'p1', productName: 'P1', currentStock: 10 })]
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /requires 8 but only 2 is available/i);
});
