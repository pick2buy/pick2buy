import { prisma } from './prisma';
import { PaymentService } from './payment';
import { randomUUID } from 'crypto';

const fail = (message: string, statusCode = 409) => Object.assign(new Error(message), { statusCode });
const money = (n: number) => Math.round(n * 100) / 100;

export async function cancelPurchase(orderId: string, actorId: string, staff: boolean, reason: string, itemId?: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(staff ? {} : { userId: actorId }) },
    include: { items: true, payments: { orderBy: { createdAt: 'desc' } }, refunds: true },
  });
  if (!order) throw fail('Order not found', 404);
  if (![...(staff ? ['PACKED'] : []), 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)) throw fail('This order can no longer be cancelled');
  const items = order.items.filter(i => !i.cancelled && (!itemId || i.id === itemId));
  if (!items.length) throw fail('Item is missing or already cancelled');
  const all = order.items.every(i => i.cancelled || items.some(selected => selected.id === i.id));
  const token = randomUUID();
  const claimed = await prisma.order.updateMany({ where: { id: order.id, status: order.status, updatedAt: order.updatedAt, operationLock: null }, data: { operationLock: token } });
  if (!claimed.count) throw fail('Order changed or a refund is being processed. Refresh and try again.');
  const paid = order.paymentStatus === 'COMPLETED';
  const previousRefund = order.refunds.reduce((sum, r) => sum + r.amount, 0);
  const lineTotal = items.reduce((sum, i) => sum + i.total, 0);
  const amount = money(Math.max(0, all ? order.grandTotal - previousRefund : lineTotal * Math.max(0, 1 - order.discountAmount / Math.max(1, order.subtotal))));
  let gatewayRefund: { id?: string; status?: string } = { status: 'processed' };
  try {
    if (paid && amount > 0 && order.paymentMethod.startsWith('RAZORPAY')) {
      const paymentId = order.paymentId || order.payments.find(p => p.status === 'COMPLETED')?.transactionId;
      if (!paymentId) throw fail('Payment reference missing. Contact support.');
      gatewayRefund = await PaymentService.createRefund(paymentId, amount, { orderNumber: order.orderNumber, reason, cancellationId: token });
    }
    await prisma.$transaction(async tx => {
      const claimedOrder = await tx.order.updateMany({ where: { id: order.id, operationLock: token }, data: { operationLock: null } });
      if (!claimedOrder.count) throw fail('Cancellation already processed');
      if (paid && amount > 0) {
        if (['PICK2BUY_WALLET', 'COD'].includes(order.paymentMethod)) {
          if (!order.userId) throw fail('Customer is required for wallet refunds');
          const wallet = await tx.wallet.upsert({ where: { userId: order.userId }, create: { userId: order.userId, balance: amount }, update: { balance: { increment: amount } } });
          await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'CREDIT', reason: 'Cancellation refund', reference: token } });
        }
        await tx.refund.create({ data: { orderId, amount, reason, status: gatewayRefund.status === 'processed' ? 'COMPLETED' : 'PENDING', refundId: gatewayRefund.id } });
      }
      for (const item of items) {
        await tx.orderItem.update({ where: { id: item.id }, data: { cancelled: true, cancellationReason: reason } });
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.productVariant.updateMany({ where: { productId: item.productId, sku: item.sku }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryTransaction.create({ data: { productId: item.productId, variantSku: item.sku, quantity: item.quantity, reason: 'ORDER_CANCELLED', referenceId: item.id } });
      }
      await tx.order.update({ where: { id: orderId }, data: {
        ...(all ? { status: 'CANCELLED', cancellationReason: reason } : {}),
        ...(all && paid ? { paymentStatus: 'REFUNDED' } : {}),
        ...(!paid && !all ? { grandTotal: money(order.grandTotal - amount), subtotal: money(order.subtotal - lineTotal), discountAmount: money(order.discountAmount - (lineTotal - amount)) } : {}),
        statusHistory: { create: { status: all ? 'CANCELLED' : order.status, comment: `Cancelled ${items.map(i => i.productName).join(', ')}: ${reason}` } },
      } });
      if (all && paid) await tx.payment.updateMany({ where: { orderId, status: 'COMPLETED' }, data: { status: 'REFUNDED' } });
    });
  } catch (error) {
    // A gateway timeout can still mean that money was transferred. Keep the
    // operation locked for reconciliation instead of issuing a second refund.
    if (!paid || !order.paymentMethod.startsWith('RAZORPAY')) {
      await prisma.order.updateMany({ where: { id: orderId, operationLock: token }, data: { operationLock: null } });
    }
    throw error;
  }
}
