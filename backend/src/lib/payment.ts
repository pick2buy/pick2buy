import crypto from 'crypto';
import { config } from '../config';

export interface CreatePaymentOrderArgs {
  orderNumber: string;
  amount: number; // in INR
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentVerificationArgs {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class PaymentService {
  public static isConfigured(): boolean {
    return Boolean(config.razorpay.keyId && config.razorpay.keySecret &&
      !config.razorpay.keyId.includes('placeholder') && !config.razorpay.keySecret.includes('placeholder'));
  }

  public static authorizationHeader(): string {
    if (!PaymentService.isConfigured()) throw Object.assign(new Error('Online payments are not configured'), { statusCode: 503 });
    return `Basic ${Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64')}`;
  }

  public static async createPaymentOrder(args: CreatePaymentOrderArgs) {
    if (!PaymentService.isConfigured()) throw Object.assign(new Error('Online payments are not configured'), { statusCode: 503 });
    const amountInPaise = Math.round(args.amount * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) throw new Error('Invalid payment amount');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: PaymentService.authorizationHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt: args.orderNumber }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Unable to start online payment. Please try again.');
    const gatewayOrder = await response.json() as { id?: string; amount?: number; currency?: string };
    if (!gatewayOrder.id || gatewayOrder.amount !== amountInPaise || gatewayOrder.currency !== 'INR') {
      throw new Error('Payment gateway returned an invalid order');
    }

    return {
      gatewayOrderId: gatewayOrder.id,
      amount: amountInPaise,
      currency: args.currency || 'INR',
      keyId: config.razorpay.keyId,
      customer: {
        name: args.customerName,
        email: args.customerEmail,
        contact: args.customerPhone,
      },
    };
  }

  /**
   * Verify signature for Razorpay payments
   */
  public static verifySignature(args: PaymentVerificationArgs): boolean {
    if (!PaymentService.isConfigured() || !/^[a-f0-9]{64}$/i.test(args.razorpaySignature || '')) return false;

    const hmac = crypto.createHmac('sha256', config.razorpay.keySecret);
    hmac.update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(generatedSignature, 'hex'), Buffer.from(args.razorpaySignature, 'hex'));
  }

  /**
   * Validate Cash on Delivery eligibility for a pincode and order amount
   */
  public static validateCodEligibility(pincode: string, orderTotal: number): { eligible: boolean; reason?: string } {
    if (!config.cod.enabled) {
      return { eligible: false, reason: 'Cash on Delivery is currently disabled' };
    }
    if (orderTotal < config.cod.minAmount) {
      return { eligible: false, reason: `Minimum order for COD is ₹${config.cod.minAmount}` };
    }
    if (orderTotal > config.cod.maxAmount) {
      return { eligible: false, reason: `Maximum order limit for COD is ₹${config.cod.maxAmount}` };
    }
    if (config.cod.restrictedPincodes.includes(pincode)) {
      return { eligible: false, reason: 'Cash on Delivery is unavailable at this PIN code' };
    }
    return { eligible: true };
  }
}
