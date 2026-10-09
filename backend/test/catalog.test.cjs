const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../dist/lib/prisma');
const { CategoryController } = require('../dist/controllers/category.controller');
const { BrandController } = require('../dist/controllers/brand.controller');
const { AdminController } = require('../dist/controllers/admin.controller');

async function call(action, { body = {}, params = {} } = {}) {
  let status = 200;
  let result;
  let failure;
  const response = { status(value) { status = value; return this; }, json(value) { result = value; return this; } };
  await action({ body, params }, response, error => { failure = error; });
  if (failure) throw failure;
  return { status, result };
}

test('admin catalog CRUD preserves parent relationships and guards deletion', async () => {
  const suffix = randomUUID().slice(0, 8);
  const parent = (await call(CategoryController.createCategory, { body: { name: `Test Category ${suffix}`, featured: false, displayOrder: 1 } })).result.data;
  const child = (await call(CategoryController.createCategory, { body: { name: `Test Subcategory ${suffix}`, parentId: parent.id, featured: true, displayOrder: 2 } })).result.data;
  const listed = (await call(CategoryController.getAdminCategories)).result.data;
  assert.equal(listed.find(item => item.id === child.id).parent.name, parent.name);
  assert.equal((await call(CategoryController.deleteCategory, { params: { id: parent.id } })).status, 409);
  const changed = (await call(CategoryController.updateCategory, { params: { id: child.id }, body: { name: `Renamed ${suffix}` } })).result.data;
  assert.equal(changed.name, `Renamed ${suffix}`);
  const product = await prisma.product.create({ data: { name: `Test Product ${suffix}`, slug: `test-product-${suffix}`, sku: `TEST-${suffix}`, description: 'Temporary catalog test product', price: 100, mrp: 120, categoryId: child.id } });
  assert.equal((await call(CategoryController.deleteCategory, { params: { id: child.id } })).status, 409);
  await prisma.product.delete({ where: { id: product.id } });
  assert.equal((await call(CategoryController.deleteCategory, { params: { id: child.id } })).status, 200);
  assert.equal((await call(CategoryController.deleteCategory, { params: { id: parent.id } })).status, 200);
});

test('brand CRUD and duplicate name protection', async () => {
  const suffix = randomUUID().slice(0, 8);
  const brand = (await call(BrandController.create, { body: { name: `Test Brand ${suffix}` } })).result.data;
  assert.equal((await call(BrandController.list)).result.data.some(item => item.id === brand.id), true);
  const renamed = (await call(BrandController.update, { params: { id: brand.id }, body: { name: `Updated Brand ${suffix}` } })).result.data;
  assert.equal(renamed.name, `Updated Brand ${suffix}`);
  await assert.rejects(call(BrandController.create, { body: { name: `Updated Brand ${suffix}` } }), error => error.statusCode === 409);
  const category = await prisma.category.create({ data: { name: `Brand Test Category ${suffix}`, slug: `brand-test-category-${suffix}` } });
  const product = await prisma.product.create({ data: { name: `Brand Test Product ${suffix}`, slug: `brand-test-product-${suffix}`, sku: `BRAND-${suffix}`, description: 'Temporary brand test product', price: 100, mrp: 120, categoryId: category.id, brandId: brand.id } });
  assert.equal((await call(BrandController.remove, { params: { id: brand.id } })).status, 409);
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.category.delete({ where: { id: category.id } });
  assert.equal((await call(BrandController.remove, { params: { id: brand.id } })).status, 200);
});

test('banner CRUD and public visibility follow schedule and active state', async () => {
  const suffix = randomUUID().slice(0, 8);
  const input = { title: `Test Banner ${suffix}`, desktopImageUrl: 'https://example.com/banner.jpg', linkUrl: '/shop', displayOrder: 1, isActive: false };
  const banner = (await call(AdminController.createBanner, { body: input })).result.data;
  assert.equal((await call(AdminController.getActiveBanners)).result.data.some(item => item.id === banner.id), false);
  const updated = (await call(AdminController.updateBanner, { params: { id: banner.id }, body: { isActive: true } })).result.data;
  assert.equal(updated.isActive, true);
  assert.equal((await call(AdminController.getActiveBanners)).result.data.some(item => item.id === banner.id), true);
  await call(AdminController.updateBanner, { params: { id: banner.id }, body: { startDate: new Date(Date.now() + 86_400_000).toISOString() } });
  assert.equal((await call(AdminController.getActiveBanners)).result.data.some(item => item.id === banner.id), false);
  assert.equal((await call(AdminController.deleteBanner, { params: { id: banner.id } })).status, 200);
});
