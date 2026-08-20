const test = require('node:test');
const assert = require('node:assert/strict');
const {
  matchWarehouseItem,
  validateDcStockAgainstInventory,
  availableStockForRow,
  mapInventoryIdentityOntoDcRow,
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

test('empty stock Level still covers a DC Level 1 row', () => {
  const inventory = [
    inv({
      _id: 'qp',
      productName: 'P1',
      category: 'workbook',
      level: '-',
      specs: '',
      subject: '-',
      currentStock: 180,
    }),
  ];
  const row = {
    productName: 'P1',
    class: '1',
    productCategory: 'workbook',
    category: 'New Students',
    level: 'L1',
    specs: 'Single Level only',
    quantity: 10,
  };
  assert.equal(availableStockForRow(inventory, row), 180);
  assert.equal(mapInventoryIdentityOntoDcRow(row, inventory).availableQuantity, 180);
});

test('duplicate Stock rows with the same identity are summed', () => {
  const inventory = [
    inv({ _id: 'qp1', productName: 'P1', category: 'workbook', specs: '', currentStock: 20 }),
    inv({ _id: 'qp2', productName: 'P1', category: 'workbook', specs: '', currentStock: 10 }),
  ];
  const row = { productName: 'P1', class: '1', productCategory: 'workbook', category: 'New Students', specs: '', quantity: 30 };
  assert.equal(availableStockForRow(inventory, row), 30);
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
});

test('DC enrollment category is ignored; Product Category from Stock still maps', () => {
  const inventory = [
    inv({ _id: 'wb', productName: 'P1', category: 'workbook', specs: '', currentStock: 180 }),
  ];
  const enrollmentOnly = { productName: 'P1', category: 'Existing Students', class: '1', quantity: 10, specs: 'Regular' };
  const withSku = { ...enrollmentOnly, productCategory: 'workbook' };
  assert.equal(availableStockForRow(inventory, withSku), 180);
  assert.equal(validateDcStockAgainstInventory([withSku], inventory).ok, true);
});

test('empty stock Subject still covers a DC row that has a subject', () => {
  const inventory = [
    inv({ _id: 'p1', productName: 'P1', category: 'workbook', specs: '', subject: '', currentStock: 180 }),
  ];
  const row = { productName: 'P1', productCategory: 'workbook', subject: 'Math', quantity: 10, specs: '' };
  assert.equal(availableStockForRow(inventory, row), 180);
});

test('P3 Single Level only stock matches exact Specs/Level/Category and ignores Class', () => {
  const inventory = [
    inv({ _id: 'a', productName: 'p3', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', currentStock: 99755 }),
    inv({ _id: 'b', productName: 'p3', class: '10', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', currentStock: 50 }),
    inv({ _id: 'regular', productName: 'p3', class: '1', category: 'lki8764d', level: 'Level 1', specs: 'Regular', currentStock: 40 }),
    inv({ _id: 'c', productName: 'p3', class: '1', category: 'lki8764d', level: 'Level 1', specs: 'Single Level only', currentStock: 500 }),
  ];
  const row = {
    productName: 'P3',
    class: '1',
    category: 'New Students',
    productCategory: 'lki8764d',
    level: 'Level 1',
    specs: 'Single Level only',
    quantity: 7,
  };
  assert.equal(availableStockForRow(inventory, row), 100345);
  assert.equal(matchWarehouseItem(inventory, row)?._id, 'a');
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, true);
  assert.equal(result.allocations[0].item._id, 'a');
  assert.equal(result.allocations[0].splits[0].qty, 7);
});

test('Regular/empty Stock specs still fulfill a leftover DC spec', () => {
  const inventory = [
    inv({ _id: 'regular', productName: 'P3', class: '1', level: 'Level 1', specs: 'Regular', currentStock: 20 }),
  ];
  const row = { productName: 'P3', class: '1', level: 'Level 1', specs: 'Single Level only', quantity: 7, category: 'New Students' };
  assert.equal(availableStockForRow(inventory, row), 20);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, true);
});

test('P4 leftover Regular/L1 still maps to Stock spec hhhhh', () => {
  const inventory = [
    inv({ _id: 'a', productName: 'p4', category: '', level: '', specs: 'hhhhh', currentStock: 20 }),
  ];
  const leftover = {
    productName: 'p4',
    class: '1',
    category: 'new Students',
    specs: 'Regular',
    level: 'L1',
    quantity: 10,
  };
  const explicit = { ...leftover, specs: 'hhhhh' };
  assert.equal(availableStockForRow(inventory, leftover), 20);
  assert.equal(availableStockForRow(inventory, explicit), 20);
});

test('P1 workbook duplicate inventory rows are aggregated without Item Type', () => {
  const inventory = [
    inv({ _id: 'a', productName: 'P1', category: 'workbook', currentStock: 90 }),
    inv({ _id: 'b', productName: 'P1', category: 'workbook', currentStock: 20 }),
  ];
  const row = { productName: 'P1', productCategory: 'workbook', quantity: 90, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 110);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, true);

  const mapped = mapInventoryIdentityOntoDcRow(row, inventory);
  assert.equal(mapped.availableQuantity, 110);
  assert.equal(mapped.hasInventoryMatch, true);
  assert.equal(mapped.productCategory, 'workbook');
});

test('DC row maps Available Qty from the matching inventory SKU', () => {
  const inventory = [
    inv({ _id: 'sku', productName: 'P1', category: 'workbook', currentStock: 20 }),
  ];
  const row = { productName: 'P1', productCategory: 'workbook', quantity: 10, specs: 'Regular' };
  const mapped = mapInventoryIdentityOntoDcRow(row, inventory);
  assert.equal(mapped.availableQuantity, 20);
  assert.equal(mapped.hasInventoryMatch, true);
  assert.equal(validateDcStockAgainstInventory([row], inventory).ok, true);
});

test('P2 Physics Books is not mixed with other subjects', () => {
  const inventory = [
    inv({ _id: 'phy', productName: 'P2', subject: 'Physics', currentStock: 40 }),
    inv({ _id: 'math', productName: 'P2', subject: 'Math', currentStock: 80 }),
  ];
  const row = { product: 'P2', subject: 'Physics', quantity: 10, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 40);
  assert.equal(matchWarehouseItem(inventory, row)?._id, 'phy');
});

test('P3 Level 1 Books is not mixed with Level 2 stock', () => {
  const inventory = [
    inv({ _id: 'l1', productName: 'P3', level: 'Level 1', currentStock: 50 }),
    inv({ _id: 'l2', productName: 'P3', level: 'Level 2', currentStock: 999 }),
  ];
  const row = { productName: 'P3', level: 'Level 1', quantity: 10, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 50);
  assert.equal(matchWarehouseItem(inventory, row)?._id, 'l1');
});

test('insufficient stock message includes Product Category when mapped', () => {
  const inventory = [
    inv({ _id: 'sku', productName: 'P1', category: 'workbook', currentStock: 5 }),
  ];
  const row = {
    productName: 'P1',
    productCategory: 'workbook',
    quantity: 10,
    specs: 'Regular',
  };
  const result = validateDcStockAgainstInventory([row], inventory);
  assert.equal(result.ok, false);
  assert.match(result.message, /workbook/i);
});

test('New Student enrollment is not used as Product Category', () => {
  const inventory = [
    inv({ _id: 'wb', productName: 'P1', category: 'workbook', currentStock: 90 }),
  ];
  const row = { productName: 'P1', category: 'New Student', productCategory: 'workbook', quantity: 10, specs: '' };
  assert.equal(availableStockForRow(inventory, row), 90);
});

test('Stock module identity is used for DC @ Warehouse Available Qty', () => {
  const stock = [
    inv({ productName: 'P1', category: 'workbook', currentStock: 180 }),
    inv({ productName: 'P2', subject: 'Phy', currentStock: 20 }),
    inv({ productName: 'P2', subject: 'math', currentStock: 20 }),
    inv({ productName: 'P3', level: 'Level 1', currentStock: 20 }),
    inv({ productName: 'P4', specs: 'hhhhh', currentStock: 20 }),
  ];
  const qty = (row) => mapInventoryIdentityOntoDcRow(row, stock).availableQuantity;
  assert.equal(qty({ productName: 'P1', productCategory: 'workbook', class: '1', specs: 'Single Level only', level: 'L1' }), 180);
  assert.equal(qty({ productName: 'P1', productCategory: 'workbook', class: '2', specs: 'Single Level only', level: 'L1' }), 180);
  assert.equal(qty({ productName: 'P2', subject: 'math', class: '1', specs: 'Regular', level: 'L1' }), 20);
  assert.equal(qty({ productName: 'P2', subject: 'Math', class: '2', specs: 'Regular', level: 'L1' }), 20);
  assert.equal(qty({ productName: 'P2', subject: 'chem', class: '1', specs: 'Regular', level: 'L1' }), 0);
  assert.equal(qty({ productName: 'P3', level: 'Level 1', class: '1', specs: 'Regular' }), 20);
  assert.equal(qty({ productName: 'P3', level: 'Level 1', class: '2', specs: 'Regular' }), 20);
  assert.equal(qty({ productName: 'P4', specs: 'hhhhh', class: '1', level: 'L1' }), 20);
});

test('Update/Submit validates the same Available Qty the DC table shows', () => {
  const stock = [
    inv({ _id: 'p1-stock', productName: 'P1', category: 'workbook', currentStock: 180 }),
    inv({ _id: 'p1-zero', productName: 'P1', category: 'workbook', level: 'L1', specs: 'Single Level only', currentStock: 0 }),
    inv({ _id: 'p2-math', productName: 'P2', subject: 'math', currentStock: 20 }),
    inv({ _id: 'p2-chem', productName: 'P2', subject: 'chem', currentStock: 0 }),
  ];
  const p1 = { productName: 'P1', productCategory: 'workbook', class: '1', specs: 'Single Level only', level: 'L1', quantity: 10 };
  const p1b = { ...p1, class: '2' };
  const p2math = { productName: 'P2', subject: 'math', class: '1', specs: 'Regular', level: 'L1', quantity: 10 };
  const p2chem = { productName: 'P2', subject: 'chem', class: '1', specs: 'Regular', level: 'L1', quantity: 10 };

  assert.equal(mapInventoryIdentityOntoDcRow(p1, stock).availableQuantity, 180);
  assert.equal(availableStockForRow(stock, p1), 180);
  assert.equal(validateDcStockAgainstInventory([p1, p1b], stock).ok, true);
  assert.equal(validateDcStockAgainstInventory([p2math], stock).ok, true);

  const chem = validateDcStockAgainstInventory([p2chem], stock);
  assert.equal(mapInventoryIdentityOntoDcRow(p2chem, stock).availableQuantity, 0);
  assert.equal(chem.ok, false);
  assert.match(chem.message, /only 0 is available/i);
});

test('backend Update uses the table Available Qty even if a second lookup would return 0', () => {
  const unmatchedStock = [
    inv({ _id: 'other', productName: 'ZZ', category: 'other', currentStock: 999 }),
  ];
  const p1 = {
    productName: 'P1',
    productCategory: 'workbook',
    class: '1',
    specs: 'Single Level only',
    level: 'L1',
    quantity: 10,
    availableQuantity: 180,
  };
  const p1b = { ...p1, class: '2' };
  const p2math = {
    productName: 'P2',
    subject: 'math',
    class: '1',
    specs: 'Regular',
    level: 'L1',
    quantity: 10,
    availableQuantity: 120,
  };
  const p2chem = {
    productName: 'P2',
    subject: 'chem',
    class: '1',
    specs: 'Regular',
    level: 'L1',
    quantity: 10,
    availableQuantity: 50,
  };
  const missing = {
    productName: 'PX',
    quantity: 10,
    availableQuantity: 0,
  };

  assert.equal(validateDcStockAgainstInventory([p1, p1b], unmatchedStock).ok, true);
  assert.equal(validateDcStockAgainstInventory([p2math], unmatchedStock).ok, true);
  assert.equal(validateDcStockAgainstInventory([p2chem], unmatchedStock).ok, true);
  const none = validateDcStockAgainstInventory([missing], unmatchedStock);
  assert.equal(none.ok, false);
  assert.match(none.message, /only 0 is available/i);
});

test('DC class does not block a Stock match on Product Category', () => {
  const inventory = [
    inv({ _id: 'wb', productName: 'P1', class: '10', category: 'workbook', currentStock: 90 }),
  ];
  const row = { productName: 'P1', class: '1', productCategory: 'workbook', quantity: 10, specs: 'Regular' };
  assert.equal(availableStockForRow(inventory, row), 90);
});
