"use strict";
// Pick2Buy Core Constants & Brand Info
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COD_SETTINGS = exports.COUPON_TYPES = exports.TICKET_PRIORITIES = exports.TICKET_STATUSES = exports.LEAD_STATUSES = exports.PRODUCT_STATUSES = exports.PAYMENT_STATUSES = exports.PAYMENT_METHODS = exports.ORDER_STATUSES = exports.ROLES = exports.BRAND = void 0;
exports.BRAND = {
    name: 'Pick2Buy',
    tagline: 'Smart Shopping, Delivered Quick',
    email: 'pick2buy.in@gmail.com',
    domain: 'pick2buy.in',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    phone: '+91 98765 43210',
    address: 'Pick2Buy Logistics Center, MG Road, Bengaluru, Karnataka, 560001',
    supportHours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
};
exports.ROLES = {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
    SUPPORT_AGENT: 'SUPPORT_AGENT',
};
exports.ORDER_STATUSES = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    PACKED: 'PACKED',
    SHIPPED: 'SHIPPED',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
    REFUNDED: 'REFUNDED',
};
exports.PAYMENT_METHODS = {
    COD: 'COD',
    RAZORPAY_UPI: 'RAZORPAY_UPI',
    RAZORPAY_CARD: 'RAZORPAY_CARD',
    RAZORPAY_NETBANKING: 'RAZORPAY_NETBANKING',
    RAZORPAY_WALLET: 'RAZORPAY_WALLET',
};
exports.PAYMENT_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
};
exports.PRODUCT_STATUSES = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    ARCHIVED: 'ARCHIVED',
};
exports.LEAD_STATUSES = {
    NEW: 'NEW',
    CONTACTED: 'CONTACTED',
    QUALIFIED: 'QUALIFIED',
    CONVERTED: 'CONVERTED',
    LOST: 'LOST',
};
exports.TICKET_STATUSES = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_CUSTOMER: 'WAITING_CUSTOMER',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
};
exports.TICKET_PRIORITIES = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
exports.COUPON_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED',
    FREE_SHIPPING: 'FREE_SHIPPING',
};
exports.DEFAULT_COD_SETTINGS = {
    enabled: true,
    minAmount: 199,
    maxAmount: 15000,
    fee: 49,
};
//# sourceMappingURL=index.js.map