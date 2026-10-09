import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const brandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional(),
  logoUrl: z.string().url().nullable().optional(),
}).strict();
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function handleError(error: any, next: NextFunction) {
  if (error?.code === 'P2002') return next(Object.assign(new Error('Brand name or slug is already in use'), { statusCode: 409 }));
  if (error?.code === 'P2025') return next(Object.assign(new Error('Brand not found'), { statusCode: 404 }));
  next(error);
}

export class BrandController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await prisma.brand.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
      res.json({ success: true, data: brands });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = brandSchema.parse(req.body);
      const slug = slugify(data.slug || data.name);
      if (!slug) return res.status(400).json({ success: false, message: 'Enter a valid brand name or slug' });
      const brand = await prisma.brand.create({ data: { name: data.name, slug, logoUrl: data.logoUrl || null } });
      res.status(201).json({ success: true, data: brand });
    } catch (error) { handleError(error, next); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = brandSchema.partial().parse(req.body);
      const slug = data.slug === undefined ? undefined : slugify(data.slug);
      if (slug === '') return res.status(400).json({ success: false, message: 'Enter a valid brand slug' });
      const brand = await prisma.brand.update({ where: { id: req.params.id }, data: { ...data, ...(slug === undefined ? {} : { slug }) } });
      res.json({ success: true, data: brand });
    } catch (error) { handleError(error, next); }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await prisma.brand.findUnique({ where: { id: req.params.id }, include: { _count: { select: { products: true } } } });
      if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
      if (brand._count.products) return res.status(409).json({ success: false, message: 'Unassign this brand from its products before deleting it' });
      await prisma.brand.delete({ where: { id: brand.id } });
      res.json({ success: true, message: 'Brand deleted' });
    } catch (error) { handleError(error, next); }
  }
}
