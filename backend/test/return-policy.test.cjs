const { test } = require('node:test');
const assert = require('node:assert/strict');
const { returnDeadline, canRequestReturn, RETURN_WINDOW_MS } = require('../dist/lib/returnPolicy');

test('returns begin at recorded delivery and expire after exactly seven days', () => {
  const deliveredAt = new Date('2026-10-01T12:00:00.000Z');
  const deadline = returnDeadline('DELIVERED', [
    { status: 'PENDING', createdAt: new Date('2026-09-25T12:00:00.000Z') },
    { status: 'DELIVERED', createdAt: deliveredAt },
  ]);
  assert.equal(deadline, deliveredAt.getTime() + RETURN_WINDOW_MS);
  assert.equal(canRequestReturn('DELIVERED', [{ status: 'DELIVERED', createdAt: deliveredAt }], deadline - 1), true);
  assert.equal(canRequestReturn('DELIVERED', [{ status: 'DELIVERED', createdAt: deliveredAt }], deadline), false);
  assert.equal(returnDeadline('SHIPPED', [{ status: 'DELIVERED', createdAt: deliveredAt }]), null);
  assert.equal(returnDeadline('DELIVERED', []), null);
});
