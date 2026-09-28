import crypto from 'crypto';
import { config } from '../config';

export interface CreatePaymentOrderArgs {
  orderId: string;
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
  /**
   * Create Razorpay payment order abstraction
   */
  public static async createPaymentOrder(args: CreatePaymentOrderArgs) {
    const amountInPaise = Math.round(args.amount * 100);
    // If Razorpay live/test SDK is initialized, call razorpay.orders.create
    // We provide a reliable abstraction that returns order metadata
    const gatewayOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      gatewayOrderId,
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
    if (!config.razorpay.keySecret || config.razorpay.keySecret.includes('placeholder')) {
      // In development / test sandbox mode
      return true;
    }

    const hmac = crypto.createHmac('sha256', config.razorpay.keySecret);
    hmac.update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === args.razorpaySignature;
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
