import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ProductController } from './product.controller';
import { randomBytes } from 'crypto';

const offerSchema = z.object({
  name: z.string().trim().min(3).max(120),
  scope: z.enum(['PRODUCT', 'CATEGORY']),
  targetId: z.string().uuid(),
  percentage: z.number().positive().max(100),
  startDate: z.coerce.date(), endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
}).refine(o => o.endDate > o.startDate, { message: 'End date must follow start date' });

export class CommerceController {
  static async referral(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.user.updateMany({ where: { id: req.user!.id, referralCode: null }, data: { referralCode: randomBytes(6).toString('hex').toUpperCase() } });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { referralCode: true } });
      const coupons = await prisma.coupon.findMany({ where: { restrictedUserId: req.user!.id, isActive: true, endDate: { gte: new Date() }, usedCount: 0 }, select: { code: true, description: true, endDate: true } });
      res.json({ success: true, data: { ...user, coupons } });
    } catch (error) { next(error); }
  }
  static async customers(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q || '').trim();
      const users = await prisma.user.findMany({
        where: { role: 'CUSTOMER', ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}) },
        select: { id: true, name: true, email: true, phone: true, isBlocked: true, createdAt: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: users });
    } catch (error) { next(error); }
  }
  static async block(req: Request, res: Response, next: NextFunction) {
    try {
      const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user || user.role !== 'CUSTOMER') return res.status(400).json({ success: false, message: 'Only customer accounts can be blocked here' });
      await prisma.$transaction(async tx => {
        await tx.user.update({ where: { id: user.id }, data: { isBlocked, refreshToken: null, tokenVersion: { increment: 1 } } });
        await tx.auditLog.create({ data: { userId: req.user!.id, action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER', resource: 'User', resourceId: user.id } });
      });
      res.json({ success: true });
    } catch (error) { next(error); }
  }
  static async offers(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } }) }); } catch (error) { next(error); }
  }
  static async saveOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = offerSchema.parse(req.body);
      const target = data.scope === 'PRODUCT' ? await prisma.product.findUnique({ where: { id: data.targetId } }) : await prisma.category.findFirst({ where: { id: data.targetId, deletedAt: null } });
      if (!target) return res.status(400).json({ success: false, message: 'Choose a valid product/category' });
      const offer = req.params.id ? await prisma.offer.update({ where: { id: req.params.id }, data }) : await prisma.offer.create({ data });
      ProductController.clearCatalogCache();
      res.json({ success: true, data: offer });
    } catch (error) { next(error); }
  }
  static async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try { await prisma.offer.delete({ where: { id: req.params.id } }); ProductController.clearCatalogCache(); res.json({ success: true }); } catch (error) { next(error); }
  }
}
