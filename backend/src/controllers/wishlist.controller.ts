import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { activeOffers, priceProduct } from '../lib/offers';
import { checkCartQuantity } from '../lib/cartQuantity';

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
                include: { images: true, category: true, variants: true },
              },
            },
          },
        },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId: req.user.id },
          include: { items: { include: { product: { include: { images: true, category: true, variants: true } } } } },
        });
      }

      const offers = await activeOffers();
      const items = wishlist.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: {
          ...priceProduct(i.product, offers),
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
      if (!req.user) return res.status(401).json({ success: false, message: 'Please log in' });
      const { productId, variantId } = req.body;
      if (typeof productId !== 'string') return res.status(400).json({ success: false, message: 'Product is required' });
      await prisma.$transaction(async tx => {
        const saved = await tx.wishlistItem.findFirst({ where: { productId, wishlist: { userId: req.user!.id } } });
        if (!saved) throw Object.assign(new Error('Item is no longer in your wishlist'), { statusCode: 409 });
        const product = await tx.product.findUnique({ where: { id: productId }, include: { variants: true, category: true } });
        if (!product || product.category.deletedAt) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
        const variant = product.variants.find(v => v.id === variantId);
        if (product.variants.length && !variant) throw Object.assign(new Error('Choose a product option on the product page'), { statusCode: 400 });
        const cart = await tx.cart.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: { updatedAt: new Date() } });
        const items = await tx.cartItem.findMany({ where: { cartId: cart.id, productId } });
        const existing = items.find(i => i.variantId === (variant?.id || null));
        checkCartQuantity(product, (existing?.quantity || 0) + 1, items.reduce((sum, i) => sum + i.quantity, 0) + 1, variant?.stock);
        if (existing) await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: 1 } } });
        else await tx.cartItem.create({ data: { cartId: cart.id, productId, variantId: variant?.id, quantity: 1, unitPrice: variant?.price ?? product.price } });
        await tx.wishlistItem.deleteMany({ where: { wishlist: { userId: req.user!.id }, productId } });
      }, { isolationLevel: 'Serializable' });
      res.json({ success: true, message: 'Moved to cart successfully' });
    } catch (error) { next(error); }
  }
}
