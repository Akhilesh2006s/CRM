const test = require('node:test');
const assert = require('node:assert/strict');
const {
  roundToTwo,
  computeCumulativePayable,
} = require('../services/programBillingService');

test('roundToTwo keeps two decimal places', () => {
  assert.equal(roundToTwo(100.555), 100.56);
  assert.equal(roundToTwo(100.554), 100.55);
});

test('computeCumulativePayable matches 10+5 scenario', () => {
  const payable = computeCumulativePayable({
    deliveredStudents: 15,
    unitPrice: 100,
    totalLevels: 2,
  });
  assert.equal(payable, 750);
});

test('computeCumulativePayable handles decimal outputs', () => {
  const payable = computeCumulativePayable({
    deliveredStudents: 7,
    unitPrice: 100,
    totalLevels: 3,
  });
  assert.equal(payable, 233.33);
});
