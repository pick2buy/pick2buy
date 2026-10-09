import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { categoryCreateSchema } from '@pick2buy/shared';
import { z } from 'zod';

const categoryFields = categoryCreateSchema.extend({
  imageUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
}).strict();
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function validateParent(parentId: string | null | undefined, ownId?: string) {
  if (!parentId) return null;
  if (parentId === ownId) throw Object.assign(new Error('A category cannot be its own parent'), { statusCode: 400 });
  const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
  if (!parent) throw Object.assign(new Error('Parent category not found'), { statusCode: 400 });
  if (parent.parentId) throw Object.assign(new Error('Subcategories cannot contain other subcategories'), { statusCode: 400 });
  if (ownId && await prisma.category.count({ where: { parentId: ownId } })) {
    throw Object.assign(new Error('Move or remove this category’s subcategories before changing its parent'), { statusCode: 409 });
  }
  return parentId;
}

function handleCategoryError(error: any, next: NextFunction) {
  if (error?.code === 'P2002') return next(Object.assign(new Error('This category slug is already in use'), { statusCode: 409 }));
  if (error?.code === 'P2025') return next(Object.assign(new Error('Category not found'), { statusCode: 404 }));
  next(error);
}

export class CategoryController {
  public static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              _count: { select: { products: true } },
            },
          },
          _count: { select: { products: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true, children: true } } },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  }

  public static async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          children: {
            include: { products: { where: { status: 'ACTIVE' }, include: { images: { orderBy: { displayOrder: 'asc' } }, brand: true, reviews: { select: { rating: true } } } } },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          },
          products: {
            where: { status: 'ACTIVE' },
            include: {
              images: { orderBy: { displayOrder: 'asc' } },
              brand: true,
              reviews: { select: { rating: true } },
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      res.json({
        success: true,
        data: { ...category, products: [...category.products, ...category.children.flatMap(child => child.products)] },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = categoryFields.parse(req.body);
      const slug = slugify(data.slug || data.name);
      if (!slug) return res.status(400).json({ success: false, message: 'Enter a valid category name or slug' });
      const parentId = await validateParent(data.parentId);

      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          bannerUrl: data.bannerUrl,
          parentId,
          featured: data.featured,
          displayOrder: data.displayOrder,
        },
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      handleCategoryError(error, next);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = categoryFields.partial().parse(req.body);
      const slug = data.slug === undefined ? undefined : slugify(data.slug);
      if (slug === '') return res.status(400).json({ success: false, message: 'Enter a valid category slug' });
      const parentId = data.parentId === undefined ? undefined : await validateParent(data.parentId, id);
      const category = await prisma.category.update({
        where: { id },
        data: { ...data, ...(slug === undefined ? {} : { slug }), ...(parentId === undefined ? {} : { parentId }) },
      });

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      handleCategoryError(error, next);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } });
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      if (category._count.products || category._count.children) return res.status(409).json({ success: false, message: 'Move or remove linked products and subcategories before deleting this category' });
      await prisma.category.delete({ where: { id } });
      res.json({
        success: true,
        message: 'Category deleted',
      });
    } catch (error) {
      handleCategoryError(error, next);
    }
  }
}
