import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { reviewCreateSchema } from '@pick2buy/shared';
import { z } from 'zod';

const reviewStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
const adminReviewCreateSchema = z.object({
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(160).nullable().optional(),
  comment: z.string().trim().min(1).max(5000),
  status: reviewStatusSchema.default('APPROVED'),
  isVerifiedPurchase: z.boolean().default(false),
  adminReply: z.string().trim().max(2000).nullable().optional(),
});
const adminReviewUpdateSchema = adminReviewCreateSchema.omit({ productId: true, userId: true }).partial();

export class ReviewController {
  public static async getAdminReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      const reviews = await prisma.review.findMany({
        where: {
          ...(productId ? { productId } : {}),
          ...(status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status } : {}),
          ...(query ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { comment: { contains: query, mode: 'insensitive' } },
              { product: { name: { contains: query, mode: 'insensitive' } } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
            ],
          } : {}),
        },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: reviews.map((review) => ({
        ...review,
        images: review.imagesJson ? JSON.parse(review.imagesJson) : [],
      })) });
    } catch (error) {
      next(error);
    }
  }

  public static async createAdminReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = adminReviewCreateSchema.parse(req.body);
      const review = await prisma.review.create({
        data,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
      res.status(201).json({ success: true, message: 'Review created successfully', data: review });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAdminReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = adminReviewUpdateSchema.parse(req.body);
      const review = await prisma.review.update({
        where: { id: req.params.reviewId },
        data,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
      res.json({ success: true, message: 'Review updated successfully', data: review });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAdminReview(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.review.delete({ where: { id: req.params.reviewId } });
      res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;

      const reviews = await prisma.review.findMany({
        where: {
          productId,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r) => {
        if (distribution[r.rating as keyof typeof distribution] !== undefined) {
          distribution[r.rating as keyof typeof distribution]++;
        }
      });

      const total = reviews.length;
      const avg = total > 0 ? reviews.reduce((a, b) => a + b.rating, 0) / total : 0;

      res.json({
        success: true,
        data: {
          reviews: reviews.map((r) => ({
            ...r,
            images: r.imagesJson ? JSON.parse(r.imagesJson) : [],
          })),
          summary: {
            averageRating: Number(avg.toFixed(1)),
            totalReviews: total,
            distribution,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Please log in to submit a review' });
      }

      const { productId } = req.params;
      const data = reviewCreateSchema.parse(req.body);

      // Check if user has purchased this product
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: {
            userId: req.user.id,
            status: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING'] },
          },
        },
      });

      const existing = await prisma.review.findFirst({ where: { productId, userId: req.user.id } });
      if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this product' });

      const review = await prisma.review.create({
        data: {
          productId,
          userId: req.user.id,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment,
          imagesJson: data.images ? JSON.stringify(data.images) : null,
          isVerifiedPurchase: Boolean(hasPurchased),
          status: 'APPROVED', // auto-approved for instant demo feedback
        },
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Thank you! Your review has been submitted.',
        data: {
          ...review,
          images: review.imagesJson ? JSON.parse(review.imagesJson) : [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async respondToReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const { adminReply } = req.body;

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { adminReply },
      });

      res.json({
        success: true,
        message: 'Review response saved',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
