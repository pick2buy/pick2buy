const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../dist/lib/prisma');
const { WishlistController } = require('../dist/controllers/wishlist.controller');
const { OrderController } = require('../dist/controllers/order.controller');
const { CommerceController } = require('../dist/controllers/commerce.controller');
const { ProductController } = require('../dist/controllers/product.controller');
const { offeredPrice } = require('../dist/lib/offers');
const { cancelPurchase } = require('../dist/lib/cancellation');
const { rewardReferral } = require('../dist/lib/referral');
const { reportRange, salesReport } = require('../dist/lib/salesReport');
const { couponCreateSchema, productCreateSchema } = require('@pick2buy/shared');
const { calculateCoupon } = require('../dist/lib/coupon');
const { authenticateJwt } = require('../dist/middlewares/auth');
const { config } = require('../dist/config');
const jwt = require('jsonwebtoken');

async function call(fn, request = {}) {
  let status = 200, body, error;
  const response = { status(n) { status = n; return this; }, json(v) { body = v; return this; }, set() { return this; } };
  await fn({ body: {}, params: {}, query: {}, headers: {}, ...request }, response, e => { error = e; });
  if (error) throw error;
  return { status, body };
}
async function fixture(stock = 5) {
  const key = randomUUID();
  const user = await prisma.user.create({ data: { name: 'Test Customer', email: key + '@example.com', passwordHash: 'test', isEmailVerified: true } });
  const category = await prisma.category.create({ data: { name: key, slug: key } });
  const product = await prisma.product.create({ data: { name: key, slug: key, sku: key, description: 'Commerce test product', price: 100, mrp: 150, stock, categoryId: category.id, maxPerCustomer: 2 } });
  const wishlist = await prisma.wishlist.create({ data: { userId: user.id, items: { create: { productId: product.id } } } });
  return { user, category, product, wishlist };
}
async function orderFixture() {
  const f = await fixture(2);
  const variant = await prisma.productVariant.create({ data: { productId: f.product.id, sku: randomUUID(), name: 'Blue', price: 100, mrp: 150, stock: 2 } });
  const order = await prisma.order.create({ data: {
    orderNumber: randomUUID(), userId: f.user.id, customerName: f.user.name, customerEmail: f.user.email, customerPhone: '9999999999', shippingAddressJson: '{}',
    status: 'CONFIRMED', paymentMethod: 'PICK2BUY_WALLET', paymentStatus: 'COMPLETED',
    subtotal: 200, taxAmount: 0, shippingFee: 0, discountAmount: 20, grandTotal: 180,
    items: { create: [1, 2].map(() => ({ productId: f.product.id, productName: f.product.name, sku: variant.sku, variantName: variant.name, quantity: 1, price: 100, mrp: 150, total: 100 })) },
  }, include: { items: true } });
  return { ...f, variant, order };
}
test('wishlist failure preserves saved item and successful move merges existing cart line', async () => {
  const f = await fixture(0);
  const req = { user: f.user, body: { productId: f.product.id } };
  await assert.rejects(call(WishlistController.moveToCart, req), /stock/);
  assert.equal(await prisma.wishlistItem.count({ where: { wishlistId: f.wishlist.id } }), 1);
  await prisma.product.update({ where: { id: f.product.id }, data: { stock: 5 } });
  await call(WishlistController.moveToCart, req);
  assert.equal(await prisma.wishlistItem.count({ where: { wishlistId: f.wishlist.id } }), 0);
  await prisma.wishlistItem.create({ data: { wishlistId: f.wishlist.id, productId: f.product.id } });
  await call(WishlistController.moveToCart, req);
  const items = await prisma.cartItem.findMany({ where: { cart: { userId: f.user.id } } });
  assert.equal(items.length, 1); assert.equal(items[0].quantity, 2);
  await prisma.wishlistItem.create({ data: { wishlistId: f.wishlist.id, productId: f.product.id } });
  await assert.rejects(call(WishlistController.moveToCart, req), /Maximum 2/);
  assert.equal(await prisma.wishlistItem.count({ where: { wishlistId: f.wishlist.id } }), 1);
});
test('partial and full cancellation restore variant stock once and allocate coupon refunds', async () => {
  const { order, user, product, variant } = await orderFixture();
  await cancelPurchase(order.id, user.id, false, 'Changed plans', order.items[0].id);
  assert.equal((await prisma.wallet.findUnique({ where: { userId: user.id } })).balance, 90);
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock, 3);
  await assert.rejects(cancelPurchase(order.id, user.id, false, 'Again', order.items[0].id));
  await cancelPurchase(order.id, user.id, false, 'Cancel remainder');
  assert.equal((await prisma.wallet.findUnique({ where: { userId: user.id } })).balance, 180);
  assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).stock, 4);
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock, 4);
  await assert.rejects(cancelPurchase(order.id, user.id, false, 'Again'));
});
test('return completion refunds net item price once and retains other delivered items', async () => {
  const { order, user } = await orderFixture();
  await prisma.order.update({ where: { id: order.id }, data: { status: 'DELIVERED' } });
  const request = await prisma.returnRequest.create({ data: { orderId: order.id, orderItemId: order.items[0].id, userId: user.id, reason: 'DAMAGED', message: 'Damaged on delivery', status: 'RECEIVED' } });
  const input = { params: { requestId: request.id }, body: { status: 'COMPLETED' } };
  assert.equal((await call(OrderController.updateReturnRequest, input)).status, 200);
  assert.equal((await prisma.wallet.findUnique({ where: { userId: user.id } })).balance, 90);
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).status, 'DELIVERED');
  assert.equal((await call(OrderController.updateReturnRequest, input)).status, 409);
});
test('only largest matching offer applies with paise rounding', () => {
  const offers = [{ scope: 'PRODUCT', targetId: 'p', percentage: 20 }, { scope: 'CATEGORY', targetId: 'c', percentage: 30 }, { scope: 'PRODUCT', targetId: 'other', percentage: 99 }];
  assert.equal(offeredPrice(199, 'p', 'c', offers), 139.3);
  assert.equal(offeredPrice(199, 'none', 'none', offers), 199);
});
test('report range uses inclusive India dates and rejects invalid ranges', () => {
  const r = reportRange({ period: 'custom', from: '2026-01-01', to: '2026-01-01' });
  assert.equal(r.start.toISOString(), '2025-12-31T18:30:00.000Z');
  assert.equal(r.end.toISOString(), '2026-01-01T18:30:00.000Z');
  assert.throws(() => reportRange({ period: 'custom', from: '2026-02-30', to: '2026-03-03' }));
  assert.throws(() => reportRange({ period: 'custom', from: '2026-03-03', to: '2026-01-01' }));
});
test('sales report excludes unpaid orders and honours date boundaries', async () => {
  const { order } = await orderFixture();
  await prisma.order.update({ where: { id: order.id }, data: { createdAt: new Date('2020-02-02T00:00:00Z') } });
  const report = await salesReport({ period: 'custom', from: '2020-02-02', to: '2020-02-02' });
  assert.equal(report.rows.some(r => r.orderNumber === order.orderNumber), true);
  assert.equal(report.rows.find(r => r.orderNumber === order.orderNumber).couponDiscount, 20);
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'PENDING' } });
  assert.equal((await salesReport({ period: 'custom', from: '2020-02-02', to: '2020-02-02' })).rows.some(r => r.orderNumber === order.orderNumber), false);
});
test('referral reward is single-use, owner-restricted and only issued once', async () => {
  const a = await fixture(), b = await fixture();
  await prisma.user.update({ where: { id: b.user.id }, data: { referredById: a.user.id } });
  await rewardReferral(b.user.id); await rewardReferral(b.user.id);
  const coupons = await prisma.coupon.findMany({ where: { restrictedUserId: a.user.id } });
  assert.equal(coupons.length, 1);
  await assert.rejects(calculateCoupon(coupons[0].code, 600, 0, b.user.id), /another customer/);
  assert.equal((await calculateCoupon(coupons[0].code, 600, 0, a.user.id)).discountAmount, 60);
});
test('blocking revokes existing sessions and unblocking does not restore old tokens', async () => {
  const f = await fixture();
  const token = jwt.sign({ id: f.user.id, tokenVersion: 0 }, config.jwt.secret);
  await call(CommerceController.block, { user: f.user, params: { id: f.user.id }, body: { isBlocked: true } });
  assert.equal((await call(authenticateJwt, { headers: { authorization: 'Bearer ' + token } })).status, 403);
  await call(CommerceController.block, { user: f.user, params: { id: f.user.id }, body: { isBlocked: false } });
  const req = { headers: { authorization: 'Bearer ' + token } };
  await call(authenticateJwt, req);
  assert.equal((await prisma.user.findUnique({ where: { id: f.user.id } })).tokenVersion, 2);
});
test('coupon validation rejects over-100 percent and reversed dates', () => {
  const input = { code: 'TEST', type: 'PERCENTAGE', value: 101, startDate: '2026-01-01', endDate: '2026-02-01' };
  assert.equal(couponCreateSchema.safeParse(input).success, false);
  assert.equal(couponCreateSchema.safeParse({ ...input, value: 10, endDate: '2025-01-01' }).success, false);
});
test('failed payment keeps order payable and cannot overwrite completed payment', async () => {
  const { order, user } = await orderFixture();
  await prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'RAZORPAY_UPI' } });
  await call(OrderController.markPaymentFailed, { user, params: { orderNumber: order.orderNumber } });
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).paymentStatus, 'PENDING');
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'COMPLETED' } });
  await call(OrderController.markPaymentFailed, { user, params: { orderNumber: order.orderNumber } });
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).paymentStatus, 'COMPLETED');
});
test('out of stock catalogue filter includes explicitly unavailable products', async () => {
  const f = await fixture(0);
  await prisma.product.update({ where: { id: f.product.id }, data: { status: 'OUT_OF_STOCK' } });
  ProductController.clearCatalogCache();
  const result = await call(ProductController.getProducts, { query: { category: f.category.id } });
  assert.equal(result.body.data.some(p => p.id === f.product.id), true);
  const inStock = await call(ProductController.getProducts, { query: { category: f.category.id, inStock: 'true' } });
  assert.equal(inStock.body.data.length, 0);
});

test('catalogue sorts globally before pagination and filters discounted prices', async () => {
  const f = await fixture(8);
  await prisma.product.update({ where: { id: f.product.id }, data: { name: 'Zebra', price: 100 } });
  const alpha = await prisma.product.create({ data: { name: 'Alpha', slug: randomUUID(), sku: randomUUID(), description: 'Sorting test', price: 200, mrp: 250, stock: 5, categoryId: f.category.id } });
  await prisma.offer.create({ data: { name: 'Half price', scope: 'PRODUCT', targetId: alpha.id, percentage: 75, startDate: new Date(Date.now() - 10000), endDate: new Date(Date.now() + 86400000) } });
  ProductController.clearCatalogCache();
  const low = await call(ProductController.getProducts, { query: { category: f.category.id, sort: 'price-low', limit: '1' } });
  assert.equal(low.body.data[0].id, alpha.id);
  assert.equal(low.body.data[0].price, 50);
  const filtered = await call(ProductController.getProducts, { query: { category: f.category.id, maxPrice: '75' } });
  assert.equal(filtered.body.data.length, 1);
  const alphabetical = await call(ProductController.getProducts, { query: { category: f.category.id, sort: 'name-desc', limit: '1' } });
  assert.equal(alphabetical.body.data[0].name, 'Zebra');
});

test('PDF and Excel reports download valid files using the same selected dates', async () => {
  const { ReportController } = require('../dist/controllers/report.controller');
  const ExcelJS = require('exceljs');
  const { PassThrough } = require('node:stream');
  const { order, user } = await orderFixture();
  await prisma.order.update({ where: { id: order.id }, data: { createdAt: new Date('2019-04-05T12:00:00Z') } });
  const download = async (action, req) => {
    const response = new PassThrough(), chunks = [];
    let status = 200;
    response.on('data', chunk => chunks.push(chunk));
    response.status = n => { status = n; return response; };
    response.type = response.attachment = () => response;
    response.send = data => response.end(data);
    response.json = () => response.end();
    const done = new Promise(resolve => response.on('end', resolve));
    await action(req, response, e => { throw e; });
    await done;
    return { data: Buffer.concat(chunks), status };
  };
  const query = { period: 'custom', from: '2019-04-05', to: '2019-04-05' };
  const excel = await download(ReportController.sales, { query: { ...query, format: 'xlsx' } });
  const book = new ExcelJS.Workbook(); await book.xlsx.load(excel.data);
  assert.equal(book.getWorksheet('Sales').getRow(2).getCell(1).value, order.orderNumber);
  assert.match(String(book.getWorksheet('Summary').getCell('A1').value), /2019-04-05/);
  const pdf = await download(ReportController.sales, { query: { ...query, format: 'pdf' } });
  assert.equal(pdf.data.subarray(0, 4).toString(), '%PDF');
  assert.match(pdf.data.toString('latin1'), /%%EOF/);
  const invoice = await download(ReportController.invoice, { params: { orderNumber: order.orderNumber }, user });
  assert.equal(invoice.data.subarray(0, 4).toString(), '%PDF');
  const stranger = await download(ReportController.invoice, { params: { orderNumber: order.orderNumber }, user: { id: randomUUID(), role: 'CUSTOMER' } });
  assert.equal(stranger.status, 404);
});

test('product image validation requires three images', () => {
  const base = { name: 'Image test', sku: 'IMG', description: 'Product description', categoryId: randomUUID(), price: 10, mrp: 20, stock: 1, images: [{ url: 'https://example.com/a.jpg' }] };
  assert.equal(productCreateSchema.safeParse(base).success, false);
  assert.equal(productCreateSchema.safeParse({ ...base, images: ['a','b','c'].map(name => ({ url: 'https://example.com/' + name + '.jpg' })) }).success, true);
});
