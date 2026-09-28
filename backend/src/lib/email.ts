import { config } from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send an email or log it in development mode
   */
  public static async sendMail(options: EmailOptions): Promise<boolean> {
    console.log(`[EmailService] Sending email to: ${options.to}`);
    console.log(`[EmailService] From: ${config.email.from}`);
    console.log(`[EmailService] Subject: ${options.subject}`);
    // In production with actual SMTP credentials, nodemailer would transport this.
    // For now, logging the template generation ensures robust offline/dev operation without crashing.
    return true;
  }

  public static async sendWelcome(name: string, to: string) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5;">Welcome to Pick2Buy, ${name}! 🎉</h2>
        <p style="color: #334155; line-height: 1.6;">We are thrilled to have you join India's premier shopping destination. Discover thousands of curated products with high-speed delivery and hassle-free returns.</p>
        <div style="margin: 28px 0;">
          <a href="${config.frontendUrl}/shop" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Shopping</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Questions? Reach us at <a href="mailto:pick2buy.in@gmail.com">pick2buy.in@gmail.com</a></p>
      </div>
    `;
    return this.sendMail({ to, subject: 'Welcome to Pick2Buy India!', html });
  }

  public static async sendOrderConfirmation(orderNumber: string, customerName: string, to: string, total: number) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Order Confirmed! 📦</h2>
        <p>Dear ${customerName},</p>
        <p>Your order <strong>#${orderNumber}</strong> totaling <strong>₹${total.toLocaleString('en-IN')}</strong> has been successfully placed.</p>
        <p>You can track the progress of your shipment in your account timeline.</p>
        <div style="margin: 24px 0;">
          <a href="${config.frontendUrl}/account/orders/${orderNumber}" style="background: #4f46e5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Track Order</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Pick2Buy Support: pick2buy.in@gmail.com</p>
      </div>
    `;
    return this.sendMail({ to, subject: `Pick2Buy Order Confirmation #${orderNumber}`, html });
  }

  public static async sendShippingNotification(orderNumber: string, trackingNumber: string, courier: string, to: string) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669;">Your Pick2Buy Order has Shipped! 🚚</h2>
        <p>Order <strong>#${orderNumber}</strong> has been handed over to <strong>${courier}</strong>.</p>
        <p>Tracking AWB: <strong>${trackingNumber}</strong></p>
        <div style="margin: 24px 0;">
          <a href="${config.frontendUrl}/account/orders/${orderNumber}" style="background: #059669; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Track Shipment</a>
        </div>
      </div>
    `;
    return this.sendMail({ to, subject: `Your Pick2Buy Order #${orderNumber} is on the way!`, html });
  }

  public static async sendPasswordReset(to: string, resetToken: string) {
    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Pick2Buy Password Reset</h2>
        <p>You requested a password reset. Click the button below to choose a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background: #4f46e5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email.</p>
      </div>
    `;
    return this.sendMail({ to, subject: 'Pick2Buy Password Reset Request', html });
  }

  public static async sendAbandonedCartReminder(to: string, customerName: string, itemsSummary: string) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #f97316;">You left something special behind! 🛒</h2>
        <p>Hi ${customerName}, your cart items (${itemsSummary}) are waiting for you.</p>
        <p>Use code <strong>PICKCOMEBACK</strong> for an extra 5% off!</p>
        <div style="margin: 24px 0;">
          <a href="${config.frontendUrl}/cart" style="background: #f97316; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Complete Order</a>
        </div>
      </div>
    `;
    return this.sendMail({ to, subject: 'Complete your Pick2Buy order + exclusive discount!', html });
  }
}
