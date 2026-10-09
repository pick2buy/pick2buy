import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { couponCreateSchema, leadCreateSchema } from '@pick2buy/shared';
import { createAuditLog } from '../lib/audit';
import { z } from 'zod';

const bannerFields = z.object({
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).nullable().optional(),
  desktopImageUrl: z.string().url(),
  mobileImageUrl: z.string().url().nullable().optional(),
  buttonText: z.string().trim().max(80).nullable().optional(),
  linkUrl: z.string().refine(value => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), 'Use an internal path or HTTPS link'),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();

function bannerData(input: Partial<z.infer<typeof bannerFields>>) {
  const { startDate, endDate, ...rest } = input;
  return {
    ...rest,
    ...(startDate === undefined ? {} : { startDate: startDate ? new Date(startDate) : null }),
    ...(endDate === undefined ? {} : { endDate: endDate ? new Date(endDate) : null }),
  };
}

export class AdminController {
  public static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
      const q = String(req.query.q || '').trim().slice(0, 100);
      const status = String(req.query.status || 'ALL');
      const where = {
        ...(status !== 'ALL' ? { status } : {}),
        ...(q ? { OR: [
          { orderNumber: { contains: q } },
          { customerName: { contains: q } },
        ] } : {}),
      };
      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20 }),
      ]);
      res.json({ success: true, data: orders, meta: { page, pageSize: 20, total } });
    } catch (error) { next(error); }
  }

  public static async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        orders,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: 5 } } }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { items: true },
        }),
      ]);

      const paidOrders = orders.filter(o => o.paymentMethod === 'COD' || o.paymentStatus === 'COMPLETED');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
      const todayRevenue = todayOrders.filter(o => o.paymentMethod === 'COD' || o.paymentStatus === 'COMPLETED').reduce((sum, o) => sum + o.grandTotal, 0);

      // Revenue grouped by last 7 days
      const daysMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daysMap[key] = { revenue: 0, orders: 0 };
      }

      paidOrders.forEach((o) => {
        const key = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (daysMap[key]) {
          daysMap[key].revenue += o.grandTotal;
          daysMap[key].orders += 1;
        }
      });

      const revenueChart = Object.entries(daysMap).map(([date, val]) => ({
        date,
        revenue: val.revenue,
        orders: val.orders,
      }));

      // Status distribution
      const statusCounts: Record<string, number> = {};
      orders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Top products sold
      const productSalesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
      paidOrders.forEach((o) => {
        o.items.forEach((item) => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = { name: item.productName, sales: 0, revenue: 0 };
          }
          productSalesMap[item.productId].sales += item.quantity;
          productSalesMap[item.productId].revenue += item.total;
        });
      });

      const topProducts = Object.entries(productSalesMap)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          totalRevenue,
          todayRevenue,
          totalOrders,
          pendingOrders,
          totalCustomers,
          totalProducts,
          lowStockCount: lowStockProducts,
          conversionRate: null,
          revenueChart,
          statusDistribution,
          topProducts,
          recentOrders: orders.slice(0, 8).map((o) => ({
            ...o,
            shippingAddress: JSON.parse(o.shippingAddressJson),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        include: {
          variants: true,
          category: true,
          inventoryLogs: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { stock: 'asc' },
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, variantId, quantityChange, reason = 'ADJUSTMENT' } = req.body;
      if (!Number.isInteger(quantityChange) || quantityChange === 0 || Math.abs(quantityChange) > 10000) {
        return res.status(400).json({ success: false, message: 'Stock change must be a non-zero whole number within 10,000 units' });
      }
      if (typeof reason !== 'string' || !reason.trim() || reason.length > 100) {
        return res.status(400).json({ success: false, message: 'A short adjustment reason is required' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await prisma.$transaction(async tx => {
        let variantSku: string | null = null;
        if (variantId) {
          const variant = await tx.productVariant.findFirst({ where: { id: variantId, productId } });
          if (!variant) throw Object.assign(new Error('Variant does not belong to this product'), { statusCode: 400 });
          variantSku = variant.sku;
          const changed = await tx.productVariant.updateMany({ where: {
            id: variantId, ...(quantityChange < 0 ? { stock: { gte: -quantityChange } } : {}),
          }, data: { stock: { increment: quantityChange } } });
          if (!changed.count) throw Object.assign(new Error('Not enough variant stock'), { statusCode: 400 });
        }
        const changed = await tx.product.updateMany({ where: {
          id: productId, ...(quantityChange < 0 ? { stock: { gte: -quantityChange } } : {}),
        }, data: { stock: { increment: quantityChange } } });
        if (!changed.count) throw Object.assign(new Error('Not enough product stock'), { statusCode: 400 });
        await tx.inventoryTransaction.create({ data: { productId, variantSku, quantity: quantityChange, reason: reason.trim() } });
      });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'ADJUST_STOCK',
        resource: 'Inventory',
        resourceId: productId,
        newValue: { quantityChange, reason },
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        include: {
          orders: { select: { grandTotal: true, createdAt: true } },
          addresses: true,
          reviews: true,
          supportTickets: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = customers.map((c) => {
        const totalSpent = c.orders.reduce((sum, o) => sum + o.grandTotal, 0);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          totalOrders: c.orders.length,
          totalSpent,
          averageOrderValue: c.orders.length ? Math.round(totalSpent / c.orders.length) : 0,
          lastOrder: c.orders.length ? c.orders[0].createdAt.toISOString() : null,
          addressesCount: c.addresses.length,
          reviewsCount: c.reviews.length,
          ticketsCount: c.supportTickets.length,
          createdAt: c.createdAt.toISOString(),
        };
      });

      res.json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  // CRM - Leads Pipeline
  public static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const leads = await prisma.lead.findMany({
        include: { activities: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = leadCreateSchema.parse(req.body);
      const lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          source: data.source,
          productInterest: data.productInterest || null,
          status: data.status,
          estimatedValue: data.estimatedValue || null,
          notes: data.notes || null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateLeadStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;
      const { status, note } = req.body;

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          status,
          lastContactedAt: new Date(),
          activities: note
            ? {
                create: {
                  type: 'STATUS_CHANGE',
                  details: `Status moved to ${status}. Note: ${note}`,
                  userId: req.user?.id,
                },
              }
            : undefined,
        },
        include: { activities: true },
      });

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  // Support Tickets
  public static async getSupportTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          customer: { select: { name: true, email: true } },
          messages: {
            include: { sender: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async replySupportTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;
      const { message, status } = req.body;

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: req.user.id,
          message,
        },
      });

      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: status || 'WAITING_CUSTOMER',
          updatedAt: new Date(),
        },
        include: {
          messages: {
            include: { sender: { select: { name: true, role: true } } },
          },
        },
      });

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  // Coupons
  public static async getCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: coupons });
    } catch (error) {
      next(error);
    }
  }

  public static async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const data = couponCreateSchema.parse(req.body);
      const coupon = await prisma.coupon.create({
        data: {
          code: data.code.toUpperCase(),
          description: data.description || null,
          type: data.type,
          value: data.value,
          minOrderValue: data.minOrderValue || null,
          maxDiscount: data.maxDiscount || null,
          usageLimit: data.usageLimit || null,
          perUserLimit: data.perUserLimit,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive: data.isActive,
          isFirstOrderOnly: data.isFirstOrderOnly,
        },
      });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE_COUPON',
        resource: 'Coupon',
        resourceId: coupon.id,
        newValue: coupon,
      });

      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.coupon.delete({ where: { id } });
      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE_COUPON',
        resource: 'Coupon',
        resourceId: id,
      });
      res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Banners & Homepage Builder
  public static async getActiveBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const banners = await prisma.banner.findMany({
        where: { isActive: true, AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ] },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
      res.json({ success: true, data: banners });
    } catch (error) { next(error); }
  }

  public static async getBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: { displayOrder: 'asc' },
      });
      res.json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  public static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const input = bannerFields.parse(req.body);
      if (input.startDate && input.endDate && input.startDate > input.endDate) return res.status(400).json({ success: false, message: 'End date must be after start date' });
      const banner = await prisma.banner.create({
        data: { ...bannerData(input), title: input.title, desktopImageUrl: input.desktopImageUrl, linkUrl: input.linkUrl, displayOrder: input.displayOrder, isActive: input.isActive },
      });
      res.status(201).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }

  public static async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = bannerFields.partial().parse(req.body);
      const current = await prisma.banner.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ success: false, message: 'Banner not found' });
      const start = input.startDate === undefined ? current.startDate : input.startDate ? new Date(input.startDate) : null;
      const end = input.endDate === undefined ? current.endDate : input.endDate ? new Date(input.endDate) : null;
      if (start && end && start > end) return res.status(400).json({ success: false, message: 'End date must be after start date' });
      const banner = await prisma.banner.update({
        where: { id },
        data: bannerData(input),
      });
      res.json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.banner.delete({ where: { id } });
      res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
      next(error);
    }
  }

  public static async getHomepageSections(req: Request, res: Response, next: NextFunction) {
    try {
      const sections = await prisma.homepageSection.findMany({
        orderBy: { displayOrder: 'asc' },
      });
      res.json({ success: true, data: sections });
    } catch (error) {
      next(error);
    }
  }

  public static async updateHomepageSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const section = await prisma.homepageSection.update({
        where: { id },
        data: req.body,
      });
      res.json({ success: true, data: section });
    } catch (error) {
      next(error);
    }
  }

  // Audit Logs
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  // Reports CSV Export
  public static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params; // 'sales', 'inventory', 'customers'

      if (type === 'sales') {
        const orders = await prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        });

        const csvRows = ['Order Number,Date,Customer,Email,Total (INR),Status,Payment Method'];
        orders.forEach((o) => {
          csvRows.push(
            `"${o.orderNumber}","${o.createdAt.toISOString()}","${o.customerName}","${o.customerEmail}",${o.grandTotal},"${o.status}","${o.paymentMethod}"`
          );
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=pick2buy_sales_report.csv');
        return res.send(csvRows.join('\n'));
      }

      if (type === 'inventory') {
        const products = await prisma.product.findMany();
        const csvRows = ['SKU,Product Name,Stock,Price (INR),Status'];
        products.forEach((p) => {
          csvRows.push(`"${p.sku}","${p.name.replace(/"/g, '""')}",${p.stock},${p.price},"${p.status}"`);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=pick2buy_inventory_report.csv');
        return res.send(csvRows.join('\n'));
      }

      res.status(400).json({ success: false, message: 'Invalid report type requested' });
    } catch (error) {
      next(error);
    }
  }
}
