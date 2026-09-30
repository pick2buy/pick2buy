import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { checkoutSchema, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '@pick2buy/shared';
import { PaymentService } from '../lib/payment';
import { EmailService } from '../lib/email';
import { createAuditLog } from '../lib/audit';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { calculateCoupon } from '../lib/coupon';
import { randomUUID } from 'crypto';

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
      const coupon = await calculateCoupon(data.couponCode, subtotal, shippingFee, userId, cart.items.map(item => item.product.categoryId));
      const discountAmount = coupon.discountAmount;
      const effectiveShippingFee = shippingFee - coupon.shippingDiscount;

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

      const grandTotal = Math.max(0, subtotal - discountAmount + effectiveShippingFee + codFee);
      const orderNumber = `P2B-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
      const paymentOrder = isCod ? null : await PaymentService.createPaymentOrder({
        orderNumber, amount: grandTotal,
        customerName: data.shippingAddress.fullName,
        customerEmail: data.shippingAddress.email || req.user?.email || '',
        customerPhone: data.shippingAddress.mobile,
      });

      // Run transactional order placement and stock deduction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: userId || null,
            customerName: data.shippingAddress.fullName,
            customerEmail: data.shippingAddress.email || req.user?.email || '',
            customerPhone: data.shippingAddress.mobile,
            shippingAddressJson: JSON.stringify(data.shippingAddress),
            status: isCod ? ORDER_STATUSES.CONFIRMED : ORDER_STATUSES.PENDING,
            paymentMethod: data.paymentMethod,
            paymentStatus: isCod ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.PENDING,
            subtotal,
            taxAmount,
            shippingFee: effectiveShippingFee,
            discountAmount,
            couponCode: coupon.code,
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
            payments: paymentOrder ? {
              create: { amount: grandTotal, method: data.paymentMethod, status: PAYMENT_STATUSES.PENDING, gatewayOrder: paymentOrder.gatewayOrderId },
            } : undefined,
          },
          include: {
            items: true,
          },
        });

        // Deduct inventory
        for (const item of cart.items) {
          if (item.variantId) {
            const variantUpdated = await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (variantUpdated.count !== 1) throw Object.assign(new Error(`Insufficient stock for ${item.product.name}`), { statusCode: 400 });
          }
          const productUpdated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (productUpdated.count !== 1) throw Object.assign(new Error(`Insufficient stock for ${item.product.name}`), { statusCode: 400 });

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
        if (coupon.couponId) {
            await tx.coupon.update({
              where: { id: coupon.couponId },
              data: { usedCount: { increment: 1 } },
            });
            if (userId) await tx.couponUsage.create({
              data: {
                couponId: coupon.couponId,
                userId,
                orderId: createdOrder.id,
              },
            });
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

      if (isCod && order.customerEmail) EmailService.sendOrderConfirmation(
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
          orderAccessToken: userId ? null : jwt.sign({ orderId: order.id, purpose: 'guest-order' }, config.jwt.secret, { expiresIn: '30d' }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
      if (![orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature].every(v => typeof v === 'string' && v.length > 0)) {
        return res.status(400).json({ success: false, message: 'Invalid payment details' });
      }

      const order = await prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (order.paymentMethod === PAYMENT_METHODS.COD) {
        return res.status(400).json({ success: false, message: 'This order does not require online payment' });
      }
      if (order.status === ORDER_STATUSES.CANCELLED) {
        return res.status(409).json({ success: false, message: 'This order has been cancelled' });
      }
      const pendingPayment = await prisma.payment.findFirst({ where: { orderId: order.id, gatewayOrder: razorpayOrderId } });
      if (!pendingPayment) return res.status(400).json({ success: false, message: 'Payment order does not match' });
      if (order.paymentStatus === PAYMENT_STATUSES.COMPLETED) {
        return res.status(order.paymentId === razorpayPaymentId ? 200 : 409).json({
          success: order.paymentId === razorpayPaymentId,
          message: order.paymentId === razorpayPaymentId ? 'Payment already verified' : 'Order already paid',
        });
      }

      const isValid = PaymentService.verifySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }

      const gatewayResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`, {
        headers: { Authorization: PaymentService.authorizationHeader() },
        signal: AbortSignal.timeout(10000),
      });
      if (!gatewayResponse.ok) return res.status(502).json({ success: false, message: 'Could not confirm payment with Razorpay' });
      const gatewayPayment = await gatewayResponse.json() as { order_id?: string; amount?: number; currency?: string; status?: string };
      if (gatewayPayment.order_id !== razorpayOrderId || gatewayPayment.amount !== Math.round(order.grandTotal * 100) ||
          gatewayPayment.currency !== 'INR' || gatewayPayment.status !== 'captured') {
        return res.status(400).json({ success: false, message: 'Payment has not been captured for this order' });
      }

      const updated = await prisma.$transaction(async tx => {
        const result = await tx.order.updateMany({
          where: { id: order.id, status: ORDER_STATUSES.PENDING, paymentStatus: PAYMENT_STATUSES.PENDING },
          data: { status: ORDER_STATUSES.CONFIRMED, paymentStatus: PAYMENT_STATUSES.COMPLETED, paymentId: razorpayPaymentId },
        });
        if (result.count !== 1) throw new Error('Payment was already processed');
        await tx.payment.update({ where: { id: pendingPayment.id }, data: {
          status: PAYMENT_STATUSES.COMPLETED, transactionId: razorpayPaymentId,
        } });
        await tx.orderStatusHistory.create({ data: {
          orderId: order.id, status: ORDER_STATUSES.CONFIRMED,
          comment: `Payment verified successfully (ID: ${razorpayPaymentId})`,
        } });
        return tx.order.findUniqueOrThrow({ where: { id: order.id } });
      });
      if (order.customerEmail) EmailService.sendOrderConfirmation(order.orderNumber, order.customerName, order.customerEmail, order.grandTotal)
        .catch(err => console.error('[Order] Email failed:', err));

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
      const isStaff = ['ADMIN', 'MANAGER', 'STAFF', 'SUPPORT_AGENT'].includes(req.user?.role || '');
      let guestAccess = false;
      const accessToken = req.headers['x-order-access'];
      if (!order.userId && typeof accessToken === 'string') {
        try {
          const claim = jwt.verify(accessToken, config.jwt.secret) as { orderId?: string; purpose?: string };
          guestAccess = claim.orderId === order.id && claim.purpose === 'guest-order';
        } catch { guestAccess = false; }
      }
      if (!isStaff && order.userId !== req.user?.id && !guestAccess) {
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

      if (!Object.values(ORDER_STATUSES).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid order status' });
      }
      if ([ORDER_STATUSES.RETURNED, ORDER_STATUSES.REFUNDED].includes(status)) {
        return res.status(400).json({ success: false, message: 'Returns and refunds require a separate verified workflow' });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (order.paymentMethod !== PAYMENT_METHODS.COD && order.paymentStatus !== PAYMENT_STATUSES.COMPLETED && status !== ORDER_STATUSES.CANCELLED) {
        return res.status(400).json({ success: false, message: 'Unpaid orders cannot be fulfilled' });
      }
      if (order.status === ORDER_STATUSES.CANCELLED && status !== ORDER_STATUSES.CANCELLED) {
        return res.status(400).json({ success: false, message: 'Cancelled orders cannot be fulfilled' });
      }
      const nextStatuses: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['PACKED', 'CANCELLED'],
        PACKED: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
      };
      if (status !== order.status && !(nextStatuses[order.status] || []).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid order status transition' });
      }
      if (status === ORDER_STATUSES.SHIPPED && (!String(trackingNumber || order.trackingNumber || '').trim() || !String(courierName || order.courierName || '').trim())) {
        return res.status(400).json({ success: false, message: 'Courier and tracking number are required to mark an order shipped' });
      }
      if (status === ORDER_STATUSES.CANCELLED && order.paymentStatus === PAYMENT_STATUSES.COMPLETED) {
        return res.status(400).json({ success: false, message: 'Paid orders require a refund before cancellation' });
      }

      const updated = await prisma.$transaction(async tx => {
        const claim = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status } });
        if (claim.count !== 1) throw Object.assign(new Error('Order status changed; reload and try again'), { statusCode: 409 });
        if (status === ORDER_STATUSES.CANCELLED && order.status !== ORDER_STATUSES.CANCELLED) {
          const items = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of items) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
            if (item.variantName) {
              const variant = await tx.productVariant.findFirst({ where: { productId: item.productId, sku: item.sku } });
              if (variant) await tx.productVariant.update({ where: { id: variant.id }, data: { stock: { increment: item.quantity } } });
            }
            await tx.inventoryTransaction.create({ data: {
              productId: item.productId, variantSku: item.variantName ? item.sku : null,
              quantity: item.quantity, reason: 'ORDER_CANCELLED', referenceId: orderId,
            } });
          }
          if (order.couponCode) {
            const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
            if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { decrement: 1 } } });
            await tx.couponUsage.deleteMany({ where: { orderId } });
          }
        }
        return tx.order.update({
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
