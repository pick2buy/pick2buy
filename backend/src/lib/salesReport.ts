import { prisma } from './prisma';
export function reportRange(query: Record<string, unknown>, now = new Date()) {
  const today = new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
  const preset = String(query.period || 'month');
  let from = today, to = today;
  if (preset === 'week') from = new Date(new Date(today).getTime() - 6 * 86400000).toISOString().slice(0, 10);
  else if (preset === 'month') from = today.slice(0, 7) + '-01';
  else if (preset === 'year') from = today.slice(0, 4) + '-01-01';
  else if (preset === 'custom') { from = String(query.from || ''); to = String(query.to || ''); }
  else if (preset !== 'day') throw Object.assign(new Error('Invalid report period'), { statusCode: 400 });
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  if (!valid(from) || !valid(to) || from > to) throw Object.assign(new Error('Choose a valid start and end date'), { statusCode: 400 });
  const start = new Date(from + 'T00:00:00+05:30'), end = new Date(new Date(to + 'T00:00:00+05:30').getTime() + 86400000);
  if (end.getTime() - start.getTime() > 5 * 366 * 86400000) throw Object.assign(new Error('Choose a range of five years or less'), { statusCode: 400 });
  return { from, to, start, end, timezone: 'Asia/Kolkata' };
}
export async function salesReport(query: Record<string, unknown>) {
  const range = reportRange(query);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.start, lt: range.end }, paymentStatus: { in: ['COMPLETED', 'REFUNDED'] } },
    include: { refunds: true, items: { include: { returnRequest: true, product: { include: { category: true, brand: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const products = new Map<string, any>(), categories = new Map<string, any>(), brands = new Map<string, any>(), days = new Map<string, number>();
  const summary = { salesCount: orders.length, orderAmount: 0, productDiscount: 0, couponDiscount: 0, overallDiscount: 0, refunds: 0, netRevenue: 0 };
  const rows = orders.map(o => {
    const refunds = o.refunds.reduce((s, r) => s + r.amount, 0);
    const productDiscount = o.items.reduce((s, i) => s + Math.max(0, (i.mrp ?? i.price) - i.price) * i.quantity, 0);
    summary.orderAmount += o.grandTotal; summary.productDiscount += productDiscount; summary.couponDiscount += o.discountAmount; summary.refunds += refunds;
    const date = new Date(o.createdAt.getTime() + 330 * 60000).toISOString().slice(0, 10);
    const bucket = range.end.getTime() - range.start.getTime() > 62 * 86400000 ? date.slice(0, 7) : date;
    days.set(bucket, (days.get(bucket) || 0) + o.grandTotal - refunds);
    for (const i of o.items.filter(i => !i.cancelled && i.returnRequest?.status !== 'COMPLETED' && o.status !== 'CANCELLED')) {
      const add = (map: Map<string, any>, id: string, name: string) => {
        const row = map.get(id) || { id, name, sales: 0, revenue: 0 };
        row.sales += i.quantity; row.revenue += i.total; map.set(id, row);
      };
      add(products, i.productId, i.productName);
      add(categories, i.product.categoryId, i.product.category.name);
      if (i.product.brand) add(brands, i.product.brand.id, i.product.brand.name);
    }
    return { orderNumber: o.orderNumber, date, customer: o.customerName, status: o.status, paymentStatus: o.paymentStatus, productDiscount, couponDiscount: o.discountAmount, gross: o.grandTotal, refunds, net: o.grandTotal - refunds };
  });
  summary.overallDiscount = summary.productDiscount + summary.couponDiscount;
  summary.netRevenue = summary.orderAmount - summary.refunds;
  const top = (map: Map<string, any>) => [...map.values()].sort((a, b) => b.sales - a.sales || a.id.localeCompare(b.id)).slice(0, 10);
  return { range, summary, rows, topProducts: top(products), topCategories: top(categories), topBrands: top(brands), revenueChart: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue })) };
}
