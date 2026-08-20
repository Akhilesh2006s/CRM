const test = require('node:test');
const assert = require('node:assert/strict');
const {
  catalogDimensions,
  applyInventoryToProductMaster,
  evaluateWarehouseItem,
} = require('../utils/warehouseProductMaster');

const P1 = {
  productName: 'P1',
  productLevels: [],
  hasSubjects: false,
  subjects: [],
  hasSpecs: false,
  specs: [],
  hasCategory: true,
  categories: ['workbook', 'hi'],
};

const P2 = {
  productName: 'P2',
  productLevels: [],
  hasSubjects: true,
  subjects: ['phy', 'math', 'chem', 'bio'],
  hasSpecs: false,
  specs: [],
  hasCategory: false,
  categories: [],
};

const P3 = {
  productName: 'P3',
  productLevels: ['Level 1', 'Level 2'],
  hasSubjects: false,
  subjects: [],
  hasSpecs: false,
  specs: [],
  hasCategory: false,
  categories: [],
};

const P4 = {
  productName: 'P4',
  productLevels: [],
  hasSubjects: false,
  subjects: [],
  hasSpecs: true,
  specs: ['hhhhh'],
  hasCategory: false,
  categories: [],
};

const P5 = {
  productName: 'P5',
  productLevels: ['Term 2'],
  hasSubjects: false,
  subjects: [],
  hasSpecs: true,
  specs: ['keer'],
  hasCategory: false,
  categories: [],
};

test('P1 shows only product categories from Product Master', () => {
  const dims = catalogDimensions(P1);
  assert.equal(dims.hasCategories, true);
  assert.deepEqual(dims.categories, ['workbook', 'hi']);
  assert.equal(dims.hasLevels, false);
  assert.equal(dims.hasSpecs, false);
  assert.equal(dims.hasSubjects, false);
});

test('P1 Regular specs leftover is cleared when category is valid', () => {
  const result = applyInventoryToProductMaster(
    { productName: 'P1', category: 'workbook', specs: 'Regular', level: 'L1' },
    P1
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.category, 'workbook');
  assert.equal(result.payload.specs, '');
  assert.equal(result.payload.level, '');
  assert.equal(result.payload.class, '');
  assert.equal(result.changed, true);
});

test('P1 without a Product Master category is rejected', () => {
  const result = applyInventoryToProductMaster({ productName: 'P1', specs: 'Regular' }, P1);
  assert.equal(result.ok, false);
  assert.match(result.message, /Product Category/i);
});

test('P2 category is stripped; valid subject is kept', () => {
  const result = applyInventoryToProductMaster(
    { productName: 'P2', category: 'workbook', subject: 'phy', specs: 'Regular' },
    P2
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.category, '');
  assert.equal(result.payload.subject, 'phy');
  assert.equal(result.payload.specs, '');
});

test('P2 without a Product Master subject is rejected', () => {
  const result = applyInventoryToProductMaster({ productName: 'P2', category: 'workbook' }, P2);
  assert.equal(result.ok, false);
  assert.match(result.message, /Subject/i);
});

test('P3 keeps Level 1 / L1 as the catalog Level 1 value and clears Regular specs', () => {
  const result = applyInventoryToProductMaster(
    { productName: 'P3', level: 'L1', specs: 'Regular', category: 'x' },
    P3
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.level, 'Level 1');
  assert.equal(result.payload.specs, '');
  assert.equal(result.payload.category, '');
});

test('P3 with an unknown level is deleted during cleanup', () => {
  const result = evaluateWarehouseItem({ productName: 'P3', level: 'Level 9' }, P3);
  assert.equal(result.action, 'delete');
});

test('P4 accepts only hhhhh specs and hides other dimensions', () => {
  const keep = applyInventoryToProductMaster({ productName: 'P4', specs: 'hhhhh' }, P4);
  assert.equal(keep.ok, true);
  assert.equal(keep.payload.specs, 'hhhhh');
  const reject = applyInventoryToProductMaster({ productName: 'P4', specs: 'Regular' }, P4);
  assert.equal(reject.ok, false);
});

test('P5 requires both keer specs and Term 2', () => {
  const keep = applyInventoryToProductMaster(
    { productName: 'P5', specs: 'keer', level: 'Term 2' },
    P5
  );
  assert.equal(keep.ok, true);
  assert.equal(keep.payload.specs, 'keer');
  assert.equal(keep.payload.level, 'Term 2');

  const missingLevel = applyInventoryToProductMaster({ productName: 'P5', specs: 'keer' }, P5);
  assert.equal(missingLevel.ok, false);
  assert.match(missingLevel.message, /Level/i);
});

test('class is not a Product Master field and is always cleared', () => {
  const result = applyInventoryToProductMaster(
    { productName: 'P3', level: 'Level 1', class: '10' },
    P3
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.level, 'Level 1');
  assert.equal(result.payload.class, '');
});

test('unknown product is deleted', () => {
  const result = evaluateWarehouseItem({ productName: 'PX', category: 'workbook' }, null);
  assert.equal(result.action, 'delete');
});
