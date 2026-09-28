import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { checkoutSchema, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '@pick2buy/shared';
import { PaymentService } from '../lib/payment';
import { EmailService } from '../lib/email';
import { createAuditLog } from '../lib/audit';

export class OrderController {
  public static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const data = checkoutSchema.parse(req.body);
      const sessionId = req.headers['x-session-id'] as string;
      const userId = req.user?.id;

      // Find user or session cart
      const cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { sessionId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Your shopping cart is empty.',
        });
      }

      // Check stock & recalculate server-side totals
      let subtotal = 0;
      for (const item of cart.items) {
        const availableStock = item.variant ? item.variant.stock : item.product.stock;
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${item.product.name}". Only ${availableStock} remaining.`,
          });
        }
        const unitPrice = item.variant ? item.variant.price : item.product.price;
        subtotal += unitPrice * item.quantity;
      }

      const shippingFee = subtotal > 499 ? 0 : 49;
      const taxAmount = Math.round(subtotal * 0.18);
      let discountAmount = 0;

      if (data.couponCode) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: data.couponCode.toUpperCase() },
        });
        if (coupon && coupon.isActive) {
          if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
            if (coupon.type === 'PERCENTAGE') {
              discountAmount = Math.round((subtotal * coupon.value) / 100);
              if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            } else if (coupon.type === 'FIXED') {
              discountAmount = Math.min(coupon.value, subtotal);
            }
          }
        }
      }

      const isCod = data.paymentMethod === PAYMENT_METHODS.COD;
      let codFee = 0;

      if (isCod) {
        const codCheck = PaymentService.validateCodEligibility(data.shippingAddress.pincode, subtotal);
        if (!codCheck.eligible) {
          return res.status(400).json({
            success: false,
            message: codCheck.reason || 'Cash on Delivery is unavailable for this order',
          });
        }
        codFee = 49;
      }

      const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + codFee);
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `P2B-${new Date().getFullYear()}-${randomSuffix}`;

      // Run transactional order placement and stock deduction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: userId || null,
            customerName: data.shippingAddress.fullName,
            customerEmail: data.shippingAddress.email || req.user?.email || 'customer@pick2buy.in',
            customerPhone: data.shippingAddress.mobile,
            shippingAddressJson: JSON.stringify(data.shippingAddress),
            status: isCod ? ORDER_STATUSES.CONFIRMED : ORDER_STATUSES.PENDING,
            paymentMethod: data.paymentMethod,
            paymentStatus: isCod ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.PENDING,
            subtotal,
            taxAmount,
            shippingFee,
            discountAmount,
            couponCode: data.couponCode || null,
            codFee,
            grandTotal,
            notes: data.notes || null,
            statusHistory: {
              create: [
                {
                  status: ORDER_STATUSES.PENDING,
                  comment: 'Order placed by customer',
                },
                ...(isCod
                  ? [
                      {
                        status: ORDER_STATUSES.CONFIRMED,
                        comment: 'Order confirmed with Cash on Delivery payment option',
                      },
                    ]
                  : []),
              ],
            },
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productImage: item.variant?.imageUrl || null,
                sku: item.variant?.sku || item.product.sku,
                variantName: item.variant?.name || null,
                price: item.variant ? item.variant.price : item.product.price,
                quantity: item.quantity,
                total: (item.variant ? item.variant.price : item.product.price) * item.quantity,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Deduct inventory
        for (const item of cart.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              variantSku: item.variant?.sku || null,
              quantity: -item.quantity,
              reason: 'SALE',
              referenceId: createdOrder.id,
            },
          });
        }

        // Empty cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        // Update coupon usage if applicable
        if (data.couponCode && userId) {
          const coupon = await tx.coupon.findUnique({ where: { code: data.couponCode.toUpperCase() } });
          if (coupon) {
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId,
                orderId: createdOrder.id,
              },
            });
          }
        }

        // Save address to user profile if user is logged in
        if (userId) {
          await tx.address.create({
            data: {
              userId,
              fullName: data.shippingAddress.fullName,
              mobile: data.shippingAddress.mobile,
              email: data.shippingAddress.email || null,
              addressLine: data.shippingAddress.addressLine,
              apartment: data.shippingAddress.apartment || null,
              landmark: data.shippingAddress.landmark || null,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state,
              pincode: data.shippingAddress.pincode,
              isDefault: data.shippingAddress.isDefault,
              type: data.shippingAddress.type || 'HOME',
            },
          });
        }

        return createdOrder;
      });

      // Prepare payment order if Razorpay
      let paymentOrder = null;
      if (!isCod) {
        paymentOrder = await PaymentService.createPaymentOrder({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.grandTotal,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
        });
      }

      // Send order confirmation email
      EmailService.sendOrderConfirmation(
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.grandTotal
      ).catch((err) => console.error('[Order] Email failed:', err));

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            grandTotal: order.grandTotal,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
          },
          paymentOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      const order = await prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const isValid = PaymentService.verifySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PAYMENT_STATUSES.FAILED },
        });
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: ORDER_STATUSES.CONFIRMED,
          paymentStatus: PAYMENT_STATUSES.COMPLETED,
          paymentId: razorpayPaymentId,
          statusHistory: {
            create: {
              status: ORDER_STATUSES.CONFIRMED,
              comment: `Payment verified successfully (ID: ${razorpayPaymentId})`,
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'Payment verified and order confirmed',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: orders.map((o) => ({
          ...o,
          shippingAddress: JSON.parse(o.shippingAddressJson),
          timeline: o.statusHistory,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getOrderByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber } = req.params;
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization if user order
      if (order.userId && req.user && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({
        success: true,
        data: {
          ...order,
          shippingAddress: JSON.parse(order.shippingAddressJson),
          timeline: order.statusHistory,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { status, comment, trackingNumber, courierName } = req.body;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          trackingNumber: trackingNumber || order.trackingNumber,
          courierName: courierName || order.courierName,
          statusHistory: {
            create: {
              status,
              comment: comment || `Status updated to ${status}`,
            },
          },
        },
        include: {
          statusHistory: true,
        },
      });

      if (status === ORDER_STATUSES.SHIPPED && trackingNumber) {
        EmailService.sendShippingNotification(
          order.orderNumber,
          trackingNumber,
          courierName || 'Pick2Buy Express',
          order.customerEmail
        ).catch((err) => console.error('[Order] Shipping email failed:', err));
      }

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE_ORDER_STATUS',
        resource: 'Order',
        resourceId: orderId,
        oldValue: { status: order.status },
        newValue: { status, trackingNumber, courierName },
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
