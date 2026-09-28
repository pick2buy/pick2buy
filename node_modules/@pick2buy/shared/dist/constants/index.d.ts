export declare const BRAND: {
    name: string;
    tagline: string;
    email: string;
    domain: string;
    country: string;
    currency: string;
    currencySymbol: string;
    phone: string;
    address: string;
    supportHours: string;
};
export declare const ROLES: {
    readonly CUSTOMER: "CUSTOMER";
    readonly ADMIN: "ADMIN";
    readonly MANAGER: "MANAGER";
    readonly STAFF: "STAFF";
    readonly SUPPORT_AGENT: "SUPPORT_AGENT";
};
export type UserRoleType = typeof ROLES[keyof typeof ROLES];
export declare const ORDER_STATUSES: {
    readonly PENDING: "PENDING";
    readonly CONFIRMED: "CONFIRMED";
    readonly PROCESSING: "PROCESSING";
    readonly PACKED: "PACKED";
    readonly SHIPPED: "SHIPPED";
    readonly OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY";
    readonly DELIVERED: "DELIVERED";
    readonly CANCELLED: "CANCELLED";
    readonly RETURNED: "RETURNED";
    readonly REFUNDED: "REFUNDED";
};
export type OrderStatusType = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
export declare const PAYMENT_METHODS: {
    readonly COD: "COD";
    readonly RAZORPAY_UPI: "RAZORPAY_UPI";
    readonly RAZORPAY_CARD: "RAZORPAY_CARD";
    readonly RAZORPAY_NETBANKING: "RAZORPAY_NETBANKING";
    readonly RAZORPAY_WALLET: "RAZORPAY_WALLET";
};
export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export declare const PAYMENT_STATUSES: {
    readonly PENDING: "PENDING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
};
export type PaymentStatusType = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];
export declare const PRODUCT_STATUSES: {
    readonly DRAFT: "DRAFT";
    readonly ACTIVE: "ACTIVE";
    readonly OUT_OF_STOCK: "OUT_OF_STOCK";
    readonly ARCHIVED: "ARCHIVED";
};
export type ProductStatusType = typeof PRODUCT_STATUSES[keyof typeof PRODUCT_STATUSES];
export declare const LEAD_STATUSES: {
    readonly NEW: "NEW";
    readonly CONTACTED: "CONTACTED";
    readonly QUALIFIED: "QUALIFIED";
    readonly CONVERTED: "CONVERTED";
    readonly LOST: "LOST";
};
export type LeadStatusType = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];
export declare const TICKET_STATUSES: {
    readonly OPEN: "OPEN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly WAITING_CUSTOMER: "WAITING_CUSTOMER";
    readonly RESOLVED: "RESOLVED";
    readonly CLOSED: "CLOSED";
};
export type TicketStatusType = typeof TICKET_STATUSES[keyof typeof TICKET_STATUSES];
export declare const TICKET_PRIORITIES: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type TicketPriorityType = typeof TICKET_PRIORITIES[keyof typeof TICKET_PRIORITIES];
export declare const COUPON_TYPES: {
    readonly PERCENTAGE: "PERCENTAGE";
    readonly FIXED: "FIXED";
    readonly FREE_SHIPPING: "FREE_SHIPPING";
};
export type CouponType = typeof COUPON_TYPES[keyof typeof COUPON_TYPES];
export declare const DEFAULT_COD_SETTINGS: {
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    fee: number;
};
//# sourceMappingURL=index.d.ts.map