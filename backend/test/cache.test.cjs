const test = require('node:test');
const assert = require('node:assert/strict');
const { AsyncCache } = require('@pick2buy/shared');

test('concurrent readers share one load, then reload after expiry', async () => {
  let now = 0;
  const cache = new AsyncCache(2, () => now);
  let loads = 0;
  const load = async () => ++loads;
  assert.deepEqual(await Promise.all([
    cache.getOrLoad('products', load, 30),
    cache.getOrLoad('products', load, 30),
  ]), [1, 1]);
  now = 29;
  assert.equal(await cache.getOrLoad('products', load, 30), 1);
  now = 30;
  assert.equal(await cache.getOrLoad('products', load, 30), 2);
});

test('failures are retried and cache capacity is bounded', async () => {
  const cache = new AsyncCache(2);
  await assert.rejects(cache.getOrLoad('a', async () => { throw new Error('offline'); }, 1000));
  assert.equal(await cache.getOrLoad('a', async () => 'recovered', 1000), 'recovered');
  await cache.getOrLoad('b', async () => 'b', 1000);
  await cache.getOrLoad('c', async () => 'c', 1000);
  assert.equal(await cache.getOrLoad('a', async () => 'reloaded', 1000), 'reloaded');
});

test('an edit during a pending load cannot restore stale cache data', async () => {
  const cache = new AsyncCache();
  let resolveOld;
  const oldRequest = cache.getOrLoad('products', () => new Promise(resolve => { resolveOld = resolve; }), 1000);
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.getOrLoad('products', async () => 'updated', 1000), 'updated');
  resolveOld('old');
  assert.equal(await oldRequest, 'old');
  assert.equal(await cache.getOrLoad('products', async () => 'unexpected reload', 1000), 'updated');
});
