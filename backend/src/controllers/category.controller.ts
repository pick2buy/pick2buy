import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { categoryCreateSchema } from '@pick2buy/shared';

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
        orderBy: { displayOrder: 'asc' },
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          children: true,
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
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = categoryCreateSchema.parse(req.body);
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          bannerUrl: data.bannerUrl,
          parentId: data.parentId || null,
          featured: data.featured,
          displayOrder: data.displayOrder,
        },
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await prisma.category.update({
        where: { id },
        data: req.body,
      });

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id } });
      res.json({
        success: true,
        message: 'Category deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}
