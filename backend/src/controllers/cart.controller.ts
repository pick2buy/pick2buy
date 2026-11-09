import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { activeOffers, offeredPrice } from '../lib/offers';
import { checkCartQuantity } from '../lib/cartQuantity';
import { calculateCoupon } from '../lib/coupon';

export class CartController {
  private static async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: {
                include: { images: true },
              },
              variant: true,
            },
          },
        },
      });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
              include: {
                product: { include: { images: true } },
                variant: true,
              },
            },
          },
        });
      }
      return cart;
    }

    // Guest cart with sessionId
    const sid = sessionId || 'guest_' + Math.random().toString(36).substring(7);
    let cart = await prisma.cart.findUnique({
      where: { sessionId: sid },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: { include: { images: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId: sid },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  }

  public static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);
      const couponCode = req.query.coupon as string | undefined;

      // Calculate server-side totals
      const offers = await activeOffers();
      let subtotal = 0;
      let totalMrp = 0;

      const items = cart.items.map((item) => {
        const unitPrice = offeredPrice(item.variant ? item.variant.price : item.product.price, item.productId, item.product.categoryId, offers);
        const unitMrp = item.variant ? item.variant.mrp : item.product.mrp;
        const totalItemPrice = unitPrice * item.quantity;
        subtotal += totalItemPrice;
        totalMrp += unitMrp * item.quantity;

        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            mrp: item.product.mrp,
            stock: item.product.stock,
            maxPerCustomer: item.product.maxPerCustomer,
            images: item.product.images,
          },
          variant: item.variant,
          quantity: item.quantity,
          unitPrice,
          totalPrice: totalItemPrice,
        };
      });

      // Free shipping on orders over ₹499
      const shipping = subtotal > 499 || subtotal === 0 ? 0 : 49;
      const tax = Math.round(subtotal * 0.18); // 18% GST estimate
      const coupon = await calculateCoupon(couponCode, subtotal, shipping, req.user?.id, cart.items.map(item => item.product.categoryId));
      const couponDiscount = coupon.discountAmount + coupon.shippingDiscount;

      const discount = Math.max(0, totalMrp - subtotal);
      const grandTotal = Math.max(0, subtotal - coupon.discountAmount + shipping - coupon.shippingDiscount);

      res.json({
        success: true,
        data: {
          id: cart.id,
          sessionId: cart.sessionId,
          items,
          subtotal,
          totalMrp,
          discount,
          tax,
          shipping: shipping - coupon.shippingDiscount,
          couponCode: coupon.code,
          couponDiscount,
          grandTotal,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, variantId, quantity = 1 } = req.body;
      if (typeof productId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ success: false, message: 'Choose a product and quantity between 1 and 99' });
      const cart = await CartController.getOrCreateCart(req.user?.id, req.headers['x-session-id'] as string);
      await prisma.$transaction(async tx => {
        await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
        const product = await tx.product.findUnique({ where: { id: productId }, include: { variants: true, category: true } });
        if (!product || product.category.deletedAt) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
        const variant = product.variants.find(v => v.id === variantId);
        if ((variantId || product.variants.length) && !variant) throw Object.assign(new Error('Choose a valid product option'), { statusCode: 400 });
        const items = await tx.cartItem.findMany({ where: { cartId: cart.id, productId } });
        const existing = items.find(i => i.variantId === (variant?.id || null));
        checkCartQuantity(product, (existing?.quantity || 0) + quantity, items.reduce((sum, i) => sum + i.quantity, 0) + quantity, variant?.stock);
        if (existing) await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } });
        else await tx.cartItem.create({ data: { cartId: cart.id, productId, variantId: variant?.id, quantity, unitPrice: variant?.price ?? product.price } });
      }, { isolationLevel: 'Serializable' });
      return CartController.getCart(req, res, next);
    } catch (error) { next(error); }
  }

  public static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return res.status(400).json({ success: false, message: 'Quantity must be between 0 and 99' });
      const cart = await CartController.getOrCreateCart(req.user?.id, req.headers['x-session-id'] as string);
      await prisma.$transaction(async tx => {
        await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
        const items = await tx.cartItem.findMany({ where: { cartId: cart.id }, include: { product: true, variant: true } });
        const item = items.find(i => i.id === req.params.itemId);
        if (!item) throw Object.assign(new Error('Cart item not found'), { statusCode: 404 });
        if (!quantity) { await tx.cartItem.delete({ where: { id: item.id } }); return; }
        checkCartQuantity(item.product, quantity, items.filter(i => i.productId === item.productId && i.id !== item.id).reduce((sum, i) => sum + i.quantity, quantity), item.variant?.stock);
        await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
      }, { isolationLevel: 'Serializable' });
      return CartController.getCart(req, res, next);
    } catch (error) { next(error); }
  }

  public static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const sessionId = req.headers['x-session-id'] as string;
      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);
      const removed = await prisma.$transaction(async tx => {
        await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
        return tx.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
      }, { isolationLevel: 'Serializable' });
      if (!removed.count) return res.status(404).json({ success: false, message: 'Cart item not found' });
      return CartController.getCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  public static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);
      await prisma.$transaction(async tx => {
        await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }, { isolationLevel: 'Serializable' });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
