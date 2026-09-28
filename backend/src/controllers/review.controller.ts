import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { reviewCreateSchema } from '@pick2buy/shared';

export class ReviewController {
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
      const avg = total > 0 ? reviews.reduce((a, b) => a + b.rating, 0) / total : 4.8;

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
