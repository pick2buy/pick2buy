const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../dist/lib/prisma');
const { storefrontCache } = require('../dist/lib/storefrontCache');
const { ProductController } = require('../dist/controllers/product.controller');
const { CategoryController } = require('../dist/controllers/category.controller');
const { AdminController } = require('../dist/controllers/admin.controller');

function stub(t, model, method, replacement) {
  const original = model[method];
  model[method] = replacement;
  t.after(() => { model[method] = original; });
}

async function call(action, query = {}) {
  let result, failure;
  const res = { set() { return this; }, json(value) { result = value; return this; } };
  await action({ query }, res, error => { failure = error; });
  if (failure) throw failure;
  return result;
}

test('concurrent catalog reads share database work and preserve discounted sorting and totals', async t => {
  storefrontCache.clear();
  const products = [
    { id: 'a', categoryId: 'category', price: 100, stock: 3, status: 'ACTIVE', reviews: [{ rating: 4 }], orderItems: [{ quantity: 2 }] },
    { id: 'b', categoryId: 'category', price: 80, stock: 2, status: 'ACTIVE', reviews: [], orderItems: [] },
  ];
  let reads = 0, counts = 0;
  stub(t, prisma.product, 'findMany', async () => { reads++; return products; });
  stub(t, prisma.product, 'count', async () => { counts++; return 2; });
  stub(t, prisma.offer, 'findMany', async () => [{ scope: 'PRODUCT', targetId: 'a', percentage: 50 }]);
  const queries = await Promise.all([
    call(ProductController.getProducts, { sort: 'price-low', limit: '1' }),
    call(ProductController.getProducts, { limit: '1', sort: 'price-low' }),
  ]);
  assert.equal(reads, 1);
  assert.equal(counts, 0, 'computed sorting already knows the total');
  assert.deepEqual(queries[0], queries[1]);
  assert.equal(queries[0].data[0].id, 'a');
  assert.equal(queries[0].data[0].price, 50);
  assert.equal(queries[0].data[0].salesCount, 2);
  assert.equal(queries[0].data[0].averageRating, 4);
  assert.equal(queries[0].meta.total, 2);
  assert.equal(queries[0].meta.totalPages, 2);
  ProductController.clearCatalogCache();
  await call(ProductController.getProducts, { sort: 'price-low', limit: '1' });
  assert.equal(reads, 2, 'an edit invalidates the cached result');
  storefrontCache.clear();
});

test('navigation reuses categories and cached banners still respect schedule boundaries', async t => {
  storefrontCache.clear();
  let categoryReads = 0, bannerReads = 0;
  stub(t, prisma.category, 'findMany', async () => { categoryReads++; return [{ id: 'category' }]; });
  const banner = { id: 'banner', startDate: null, endDate: new Date(Date.now() + 60_000) };
  stub(t, prisma.banner, 'findMany', async () => { bannerReads++; return [banner]; });
  await Promise.all([call(CategoryController.getCategories), call(CategoryController.getCategories)]);
  assert.equal(categoryReads, 1);
  assert.equal((await call(AdminController.getActiveBanners)).data.length, 1);
  // Simulate a cached record crossing its scheduled end without invalidation.
  banner.endDate = new Date(Date.now() - 1000);
  assert.equal((await call(AdminController.getActiveBanners)).data.length, 0);
  assert.equal(bannerReads, 1);
  storefrontCache.clear();
});
