const test = require('node:test');
const assert = require('node:assert/strict');
const {
  belongsOnClosedSalesList,
  hasExplicitDcRequest,
} = require('../constants/dcWorkflow');

test('Edit PO / saved draft is not Closed Sales', () => {
  assert.equal(belongsOnClosedSalesList({ status: 'saved' }), false);
  assert.equal(belongsOnClosedSalesList({ status: 'pending' }), false);
  assert.equal(belongsOnClosedSalesList({ status: 'completed' }), false);
});

test('EM approval does not put a sale on Closed Sales', () => {
  assert.equal(
    belongsOnClosedSalesList({
      status: 'saved',
      pendingEdit: { status: 'approved' },
    }),
    false
  );
  assert.equal(
    belongsOnClosedSalesList({
      status: 'dc_requested',
      pendingEdit: { status: 'approved', requestedAt: new Date() },
    }),
    false
  );
});

test('dc_requested without Request DC markers is not Closed Sales', () => {
  assert.equal(hasExplicitDcRequest({ status: 'dc_requested' }), false);
  assert.equal(belongsOnClosedSalesList({ status: 'dc_requested' }), false);
  assert.equal(
    belongsOnClosedSalesList({ status: 'dc_requested', workflowStage: 'ClosedSales' }),
    false
  );
});

test('Executive Request DC appears in Closed Sales', () => {
  assert.equal(
    belongsOnClosedSalesList({
      status: 'dc_requested',
      requestedAt: new Date(),
      requestedBy: 'user1',
    }),
    true
  );
  assert.equal(
    belongsOnClosedSalesList({
      status: 'dc_accepted',
      requestedAt: new Date(),
    }),
    true
  );
});

test('pipeline stages after Raise DC leave Closed Sales', () => {
  assert.equal(
    belongsOnClosedSalesList({
      status: 'dc_requested',
      requestedAt: new Date(),
      workflowStage: 'PendingDC',
    }),
    false
  );
});

test('warehouse completed sale is not Closed Sales', () => {
  assert.equal(
    belongsOnClosedSalesList({
      status: 'completed',
      workflowStage: 'CompletedDC',
    }),
    false
  );
  assert.equal(
    belongsOnClosedSalesList({
      status: 'dc_sent_to_senior',
      workflowStage: 'CompletedDC',
    }),
    false
  );
});
