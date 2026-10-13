import { Request, Response, NextFunction } from 'express';
import { addressSchema } from '@pick2buy/shared';
import { prisma } from '../lib/prisma';

const addressFields = addressSchema.strict();

export class AddressController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = addressFields.parse(req.body);
      const address = await prisma.$transaction(async (tx) => {
        const firstAddress = await tx.address.count({ where: { userId } }) === 0;
        if (data.isDefault || firstAddress) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
        return tx.address.create({ data: { ...data, email: data.email || null, userId, isDefault: data.isDefault || firstAddress } });
      });
      res.status(201).json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = addressFields.partial().strict().parse(req.body);
      if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'No address changes provided' });
      const address = await prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({ where: { id: req.params.id, userId } });
        if (!existing) return null;
        if (data.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
        return tx.address.update({ where: { id: existing.id }, data: { ...data, ...(data.email !== undefined ? { email: data.email || null } : {}) } });
      });
      if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
      res.json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const deleted = await prisma.$transaction(async (tx) => {
        const existing = await tx.address.findFirst({ where: { id: req.params.id, userId } });
        if (!existing) return false;
        await tx.address.delete({ where: { id: existing.id } });
        if (existing.isDefault) {
          const replacement = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
          if (replacement) await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
        }
        return true;
      });
      if (!deleted) return res.status(404).json({ success: false, message: 'Address not found' });
      res.json({ success: true, message: 'Address deleted' });
    } catch (error) { next(error); }
  }
}
