// Pick2Buy Core Constants & Brand Info

export const BRAND = {
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

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
} as const;

export type UserRoleType = typeof ROLES[keyof typeof ROLES];

export const ORDER_STATUSES = {
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
} as const;

export type OrderStatusType = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

export const PAYMENT_METHODS = {
  COD: 'COD',
  RAZORPAY_UPI: 'RAZORPAY_UPI',
  RAZORPAY_CARD: 'RAZORPAY_CARD',
  RAZORPAY_NETBANKING: 'RAZORPAY_NETBANKING',
  RAZORPAY_WALLET: 'RAZORPAY_WALLET',
} as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

export const PRODUCT_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProductStatusType = typeof PRODUCT_STATUSES[keyof typeof PRODUCT_STATUSES];

export const LEAD_STATUSES = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;

export type LeadStatusType = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];

export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatusType = typeof TICKET_STATUSES[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketPriorityType = typeof TICKET_PRIORITIES[keyof typeof TICKET_PRIORITIES];

export const COUPON_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;

export type CouponType = typeof COUPON_TYPES[keyof typeof COUPON_TYPES];

export const DEFAULT_COD_SETTINGS = {
  enabled: true,
  minAmount: 199,
  maxAmount: 15000,
  fee: 49,
};
