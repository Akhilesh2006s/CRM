const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveAssignedVendor, productAssignmentKey } = require('../utils/vendorProductAssignment');

function mapFrom(entries) {
  return new Map(entries);
}

test('product assignment key is case-insensitive', () => {
  assert.equal(productAssignmentKey('P1'), 'p1');
  assert.equal(productAssignmentKey(' product5 '), 'product5');
});

test('single assigned vendor is selected and locked', () => {
  const byProduct = mapFrom([
    ['p1', [{ _id: 'v1', name: 'Vendor 1' }]],
  ]);
  const resolved = resolveAssignedVendor('P1', 'Vendor 2', byProduct);
  assert.equal(resolved.selectedName, 'Vendor 1');
  assert.equal(resolved.locked, true);
  assert.equal(String(resolved.vendorId), 'v1');
});

test('unassigned product keeps the current vendor', () => {
  const resolved = resolveAssignedVendor('P9', 'Vendor 3', new Map());
  assert.equal(resolved.selectedName, 'Vendor 3');
  assert.equal(resolved.locked, false);
  assert.equal(resolved.assigned.length, 0);
});

test('multiple assigned vendors keep the current one when it matches', () => {
  const byProduct = mapFrom([
    [
      'p1',
      [
        { _id: 'v1', name: 'Vendor 1' },
        { _id: 'v2', name: 'Vendor 2' },
      ],
    ],
  ]);
  const resolved = resolveAssignedVendor('p1', 'Vendor 2', byProduct);
  assert.equal(resolved.selectedName, 'Vendor 2');
  assert.equal(resolved.locked, false);
  assert.equal(String(resolved.vendorId), 'v2');
});
