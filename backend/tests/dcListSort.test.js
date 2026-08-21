const test = require('node:test');
const assert = require('node:assert/strict');
const { dcSubmissionTimeMs, sortDcsNewestFirst } = require('../utils/dcListSort');

test('dc list sort uses completedAt over older createdAt/dcDate', () => {
  const kuku = {
    customerName: 'kuku',
    createdAt: '2026-08-21T14:21:51.000Z',
    dcDate: '2026-08-12T00:00:00.000Z',
    completedAt: '2026-08-21T15:47:01.000Z',
    updatedAt: '2026-08-21T15:47:01.000Z',
  };
  const olderSubmit = {
    customerName: 'older',
    createdAt: '2026-08-21T16:00:00.000Z',
    dcDate: '2026-08-20T00:00:00.000Z',
    completedAt: '2026-08-21T16:05:00.000Z',
    updatedAt: '2026-08-21T16:05:00.000Z',
  };
  const sorted = sortDcsNewestFirst([kuku, olderSubmit]);
  assert.equal(sorted[0].customerName, 'older');
  assert.equal(sorted[1].customerName, 'kuku');
  assert.ok(dcSubmissionTimeMs(kuku) > new Date(kuku.createdAt).getTime());
});

test('dc list sort ignores form dcDate when submission timestamps exist', () => {
  const recentSubmitOldFormDate = {
    name: 'new',
    dcDate: '2020-01-01T00:00:00.000Z',
    updatedAt: '2026-08-21T18:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const oldSubmitNewFormDate = {
    name: 'old',
    dcDate: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
  };
  const sorted = sortDcsNewestFirst([oldSubmitNewFormDate, recentSubmitOldFormDate]);
  assert.equal(sorted[0].name, 'new');
});
