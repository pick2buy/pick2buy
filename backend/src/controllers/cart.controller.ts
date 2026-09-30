import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { calculateCoupon } from '../lib/coupon';

export class CartController {
  private static async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
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
      let subtotal = 0;
      let totalMrp = 0;

      const items = cart.items.map((item) => {
        const unitPrice = item.variant ? item.variant.price : item.product.price;
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
      const sessionId = req.headers['x-session-id'] as string;

      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 99' });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      if (product.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Product is unavailable' });

      // Check stock
      let availableStock = product.stock;
      let unitPrice = product.price;

      if (variantId) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant) return res.status(400).json({ success: false, message: 'Invalid product variant' });
        availableStock = variant.stock;
        unitPrice = variant.price;
      }

      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`,
        });
      }

      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (availableStock < newQty || newQty > 99) {
          return res.status(400).json({
            success: false,
            message: `Cannot add more. Total in cart exceeds available stock (${availableStock})`,
          });
        }
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
            unitPrice,
          },
        });
      }

      return CartController.getCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  public static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
        return res.status(400).json({ success: false, message: 'Quantity must be between 0 and 99' });
      }
      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);
      const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { product: true, variant: true } });
      if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });
      if (quantity > (item.variant?.stock ?? item.product.stock)) {
        return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
      }

      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: itemId } });
      } else {
        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity },
        });
      }

      return CartController.getCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  public static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const sessionId = req.headers['x-session-id'] as string;
      const cart = await CartController.getOrCreateCart(req.user?.id, sessionId);
      const removed = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
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
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
