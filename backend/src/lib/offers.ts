import { prisma } from './prisma';
export type PriceOffer = { scope: string; targetId: string; percentage: number };
export async function activeOffers() {
  const now = new Date();
  return prisma.offer.findMany({ where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } });
}
export function offeredPrice(price: number, productId: string, categoryId: string, offers: PriceOffer[]) {
  const percentage = Math.max(0, ...offers.filter(o => (o.scope === 'PRODUCT' && o.targetId === productId) || (o.scope === 'CATEGORY' && o.targetId === categoryId)).map(o => o.percentage));
  return Math.round(price * (100 - percentage)) / 100;
}
export function priceProduct<T extends { id: string; categoryId: string; price: number; variants?: { price: number }[] }>(product: T, offers: PriceOffer[]): T {
  return { ...product, price: offeredPrice(product.price, product.id, product.categoryId, offers), ...(product.variants ? { variants: product.variants.map(v => ({ ...v, price: offeredPrice(v.price, product.id, product.categoryId, offers) })) } : {}) };
}
