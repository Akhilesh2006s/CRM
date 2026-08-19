const test = require('node:test');
const assert = require('node:assert/strict');
const {
  matchWarehouseItem,
  validateDcStockAgainstInventory,
  availableStockForRow,
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

test('empty inventory level still covers a DC Level 1 / L1 row', () => {
  const inventory = [
    inv({
      _id: 'qp',
      productName: 'P1',
      category: 'workbook',
      level: '-',
      specs: 'Regular',
      subject: '-',
      itemType: 'Question Paper',
      currentStock: 20,
    }),
  ];
  const row = {
    productName: 'P1',
    class: '1',
    category: 'New Students',
    level: 'L1',
    specs: 'Regular',
    quantity: 20,
  };
  assert.equal(availableStockForRow(inventory, row), 20);
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
});

test('compatible duplicate Question Paper rows are aggregated (20 + 10 = 30)', () => {
  const inventory = [
    inv({ _id: 'qp1', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper', currentStock: 20 }),
    inv({ _id: 'qp2', productName: 'P1', category: 'workbook', specs: 'Regular', itemType: 'Question Paper', currentStock: 10 }),
  ];
  const row = { productName: 'P1', class: '1', level: 'Level 1', category: 'New Students', specs: 'Regular', quantity: 30 };
  assert.equal(availableStockForRow(inventory, row), 30);
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
});

test('DC enrollment category does not block workbook inventory', () => {
  const inventory = [
    inv({ _id: 'wb', productName: 'P1', category: 'workbook', specs: 'Regular', currentStock: 20 }),
  ];
  const row = { productName: 'P1', category: 'Existing Students', class: '1', quantity: 20, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 20);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, true);
});

test('empty inventory subject still covers a DC row that has a subject', () => {
  const inventory = [
    inv({ _id: 'p1', productName: 'P1', category: 'workbook', specs: 'Regular', subject: '', currentStock: 20 }),
  ];
  const row = { productName: 'P1', subject: 'Math', quantity: 20, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 20);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, true);
});

test('P3 Single Level only Books stock is not blocked by DC Class/Category', () => {
  const inventory = [
    inv({ _id: 'qp', productName: 'p3', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', itemType: 'Question Paper', currentStock: 99755 }),
    inv({ _id: 'books10', productName: 'p3', class: '10', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', itemType: 'Books', currentStock: 50 }),
    inv({ _id: 'booksRegular', productName: 'p3', class: '1', category: 'lki8764d', level: 'Level 1', specs: 'Regular', itemType: 'Books', currentStock: 40 }),
    inv({ _id: 'books500', productName: 'p3', class: '1', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', itemType: 'Books', currentStock: 500 }),
  ];
  const row = {
    productName: 'P3',
    class: '1',
    category: 'New Students',
    level: 'Level 1',
    specs: 'Single Level only',
    quantity: 7,
  };
  assert.equal(availableStockForRow(inventory, row), 500);
  assert.equal(matchWarehouseItem(inventory, row)?._id, 'books500');
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
  assert.equal(result.allocations[0].item._id, 'books500');
  assert.equal(result.allocations[0].splits[0].qty, 7);
});

test('Regular specs stock is not used for Single Level only DC rows', () => {
  const inventory = [
    inv({ _id: 'regular', productName: 'P3', class: '1', level: 'Level 1', specs: 'Regular', itemType: 'Books', currentStock: 40 }),
  ];
  const row = { productName: 'P3', class: '1', level: 'Level 1', specs: 'Single Level only', quantity: 7, category: 'New Students' };
  assert.equal(availableStockForRow(inventory, row), 0);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, false);
});

test('P4 DC Regular/L1 uses existing P4 Books stock even if inventory specs is custom', () => {
  const inventory = [
    inv({ _id: 'qp', productName: 'p4', category: '564uyb', level: '', specs: 'hhhhh', itemType: 'Question Paper', currentStock: 149 }),
    inv({ _id: 'books500', productName: 'p4', class: '1', category: '564uyb', specs: 'hhhhh', itemType: 'Books', currentStock: 500 }),
  ];
  const row = {
    productName: 'p4',
    class: '1',
    category: 'new Students',
    specs: 'Regular',
    level: 'L1',
    quantity: 10,
  };
  assert.equal(availableStockForRow(inventory, row), 500);
  assert.equal(matchWarehouseItem(inventory, row)?._id, 'books500');
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
});
