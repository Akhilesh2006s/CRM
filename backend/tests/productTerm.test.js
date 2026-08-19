const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveExistingProductTerm,
  normalizeProductTerm,
  persistProductTerm,
} = require('../utils/productTerm');

test('Level 2 existing row shows Term 2 even when stored term defaulted to Term 1', () => {
  assert.equal(
    resolveExistingProductTerm({ product: 'p3', level: 'Level 2', term: 'Term 1', quantity: 10 }),
    'Term 2'
  );
});

test('Level 1 existing row keeps Term 1', () => {
  assert.equal(
    resolveExistingProductTerm({ product: 'p3', level: 'Level 1', term: 'Term 1', quantity: 10 }),
    'Term 1'
  );
});

test('explicit Term 2 with no level is kept', () => {
  assert.equal(resolveExistingProductTerm({ term: 'Term 2' }), 'Term 2');
});

test('new/empty allocation still defaults to Term 1', () => {
  assert.equal(resolveExistingProductTerm({}), 'Term 1');
  assert.equal(normalizeProductTerm(''), 'Term 1');
});

test('Level 3 maps dynamically to Term 3', () => {
  assert.equal(resolveExistingProductTerm({ level: 'Level 3' }), 'Term 3');
});

test('persistProductTerm recovers Term 2 from Level 2 before schema default Term 1', () => {
  assert.equal(
    persistProductTerm({ product: 'p3', level: 'Level 2', term: 'Term 1', quantity: 10 }),
    'Term 2'
  );
  assert.equal(
    persistProductTerm({ product: 'p3', level: 'Level 2', term: '', quantity: 10 }),
    'Term 2'
  );
});

test('persistProductTerm keeps Term 1 for Level 1', () => {
  assert.equal(
    persistProductTerm({ product: 'p3', level: 'Level 1', term: 'Term 1', quantity: 10 }),
    'Term 1'
  );
});

test('persistProductTerm keeps explicit Term 2 without a level', () => {
  assert.equal(persistProductTerm({ term: 'Term 2' }), 'Term 2');
});
