import { prisma } from './prisma';
const invalid = (message: string) => Object.assign(new Error(message), { statusCode: 400 });

export async function calculateCoupon(code: string | undefined, subtotal: number, shippingFee: number, userId?: string, categoryIds: string[] = []) {
  if (!code) return { code: null, discountAmount: 0, shippingDiscount: 0, couponId: null };
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.isActive || coupon.startDate > now || coupon.endDate < now) throw invalid('Coupon is invalid or expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw invalid('Coupon usage limit reached');
  if (coupon.minOrderValue !== null && subtotal < coupon.minOrderValue) throw invalid(`Coupon requires an order of at least ₹${coupon.minOrderValue}`);
  if (coupon.categoryId && !categoryIds.includes(coupon.categoryId)) throw invalid('Coupon does not apply to these products');
  if (coupon.isFirstOrderOnly) {
    if (!userId) throw invalid('Sign in to use this first-order coupon');
    if (await prisma.order.count({ where: { userId } }) > 0) throw invalid('Coupon is for first orders only');
  }
  if (userId && coupon.perUserLimit !== null &&
      await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } }) >= coupon.perUserLimit) {
    throw invalid('You have already used this coupon');
  }
  const discountAmount = coupon.type === 'PERCENTAGE'
    ? Math.min(Math.round(subtotal * coupon.value / 100), coupon.maxDiscount ?? subtotal, subtotal)
    : coupon.type === 'FIXED' ? Math.min(coupon.value, subtotal) : 0;
  return { code: coupon.code, discountAmount, shippingDiscount: coupon.type === 'FREE_SHIPPING' ? shippingFee : 0, couponId: coupon.id };
}
