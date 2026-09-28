import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class WishlistController {
  public static async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.json({ success: true, data: [] });
      }

      let wishlist = await prisma.wishlist.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                include: { images: true, category: true },
              },
            },
          },
        },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId: req.user.id },
          include: { items: { include: { product: { include: { images: true, category: true } } } } },
        });
      }

      const items = wishlist.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: {
          ...i.product,
          averageRating: 4.8,
          highlights: i.product.highlights ? JSON.parse(i.product.highlights) : [],
        },
        createdAt: i.createdAt.toISOString(),
      }));

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to save items to your wishlist',
        });
      }

      const { productId } = req.body;
      let wishlist = await prisma.wishlist.findUnique({
        where: { userId: req.user.id },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId: req.user.id },
        });
      }

      const existing = await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
      });

      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        return res.json({
          success: true,
          action: 'removed',
          message: 'Removed from wishlist',
        });
      } else {
        await prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId,
          },
        });
        return res.json({
          success: true,
          action: 'added',
          message: 'Added to wishlist',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  public static async moveToCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Please log in' });
      }

      const { productId } = req.body;
      const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
      if (wishlist) {
        await prisma.wishlistItem.deleteMany({
          where: { wishlistId: wishlist.id, productId },
        });
      }

      // Add to cart
      let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: req.user.id } });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        await prisma.cartItem.upsert({
          where: { id: 'temp-upsert-check' },
          update: { quantity: { increment: 1 } },
          create: {
            cartId: cart.id,
            productId,
            quantity: 1,
            unitPrice: product.price,
          },
        }).catch(async () => {
          // If upsert id fallback fails, regular create
          await prisma.cartItem.create({
            data: {
              cartId: cart!.id,
              productId,
              quantity: 1,
              unitPrice: product.price,
            },
          });
        });
      }

      res.json({
        success: true,
        message: 'Moved to cart successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
