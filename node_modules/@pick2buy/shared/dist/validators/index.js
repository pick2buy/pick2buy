"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportTicketCreateSchema = exports.leadCreateSchema = exports.couponCreateSchema = exports.reviewCreateSchema = exports.categoryCreateSchema = exports.productCreateSchema = exports.checkoutSchema = exports.addressSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
// Authentication Schemas
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Please enter a valid email address'),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number').optional().or(zod_1.z.literal('')),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
// Address Schema
exports.addressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name is required'),
    mobile: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number is required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    addressLine: zod_1.z.string().min(5, 'Address line is required'),
    apartment: zod_1.z.string().optional(),
    landmark: zod_1.z.string().optional(),
    city: zod_1.z.string().min(2, 'City is required'),
    state: zod_1.z.string().min(2, 'State is required'),
    pincode: zod_1.z.string().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code is required'),
    isDefault: zod_1.z.boolean().default(false),
    type: zod_1.z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
});
// Checkout Schema
exports.checkoutSchema = zod_1.z.object({
    shippingAddress: exports.addressSchema,
    paymentMethod: zod_1.z.enum([
        constants_1.PAYMENT_METHODS.COD,
        constants_1.PAYMENT_METHODS.RAZORPAY_UPI,
        constants_1.PAYMENT_METHODS.RAZORPAY_CARD,
        constants_1.PAYMENT_METHODS.RAZORPAY_NETBANKING,
        constants_1.PAYMENT_METHODS.RAZORPAY_WALLET,
    ]),
    couponCode: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
// Product Schemas
exports.productCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Product name is required'),
    slug: zod_1.z.string().min(3).optional(),
    sku: zod_1.z.string().min(2, 'SKU is required'),
    description: zod_1.z.string().min(10, 'Detailed description is required'),
    shortDescription: zod_1.z.string().max(300).optional(),
    categoryId: zod_1.z.string().min(1, 'Category is required'),
    brandId: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0, 'Price must be positive'),
    mrp: zod_1.z.number().min(0, 'MRP must be positive'),
    costPrice: zod_1.z.number().min(0).optional(),
    stock: zod_1.z.number().int().min(0),
    lowStockThreshold: zod_1.z.number().int().default(5),
    status: zod_1.z.enum([constants_1.PRODUCT_STATUSES.DRAFT, constants_1.PRODUCT_STATUSES.ACTIVE, constants_1.PRODUCT_STATUSES.OUT_OF_STOCK, constants_1.PRODUCT_STATUSES.ARCHIVED]).default(constants_1.PRODUCT_STATUSES.ACTIVE),
    isFeatured: zod_1.z.boolean().default(false),
    isBestSeller: zod_1.z.boolean().default(false),
    isTrending: zod_1.z.boolean().default(false),
    isFlashDeal: zod_1.z.boolean().default(false),
    flashDealEnd: zod_1.z.string().optional(),
    highlights: zod_1.z.array(zod_1.z.string()).default([]),
    specifications: zod_1.z.record(zod_1.z.string()).default({}),
    images: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url('Invalid image URL'),
        altText: zod_1.z.string().optional(),
        isPrimary: zod_1.z.boolean().default(false),
    })).default([]),
    variants: zod_1.z.array(zod_1.z.object({
        sku: zod_1.z.string().min(2),
        name: zod_1.z.string().min(1),
        size: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        material: zod_1.z.string().optional(),
        storage: zod_1.z.string().optional(),
        price: zod_1.z.number().min(0),
        mrp: zod_1.z.number().min(0),
        stock: zod_1.z.number().int().min(0),
        imageUrl: zod_1.z.string().url().optional(),
    })).default([]),
});
// Category Schema
exports.categoryCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Category name is required'),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    bannerUrl: zod_1.z.string().url().optional(),
    parentId: zod_1.z.string().optional().nullable(),
    featured: zod_1.z.boolean().default(false),
    displayOrder: zod_1.z.number().int().default(0),
});
// Review Schema
exports.reviewCreateSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    title: zod_1.z.string().max(100).optional(),
    comment: zod_1.z.string().min(5, 'Review comment must be at least 5 characters'),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
});
// Coupon Schema
exports.couponCreateSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(20).toUpperCase(),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum([constants_1.COUPON_TYPES.PERCENTAGE, constants_1.COUPON_TYPES.FIXED, constants_1.COUPON_TYPES.FREE_SHIPPING]),
    value: zod_1.z.number().min(0),
    minOrderValue: zod_1.z.number().min(0).optional(),
    maxDiscount: zod_1.z.number().min(0).optional(),
    usageLimit: zod_1.z.number().int().min(1).optional(),
    perUserLimit: zod_1.z.number().int().min(1).default(1),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    isActive: zod_1.z.boolean().default(true),
    isFirstOrderOnly: zod_1.z.boolean().default(false),
    categoryId: zod_1.z.string().optional().nullable(),
});
// Lead Schema
exports.leadCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().optional(),
    source: zod_1.z.string().default('WEBSITE'),
    productInterest: zod_1.z.string().optional(),
    status: zod_1.z.enum([
        constants_1.LEAD_STATUSES.NEW,
        constants_1.LEAD_STATUSES.CONTACTED,
        constants_1.LEAD_STATUSES.QUALIFIED,
        constants_1.LEAD_STATUSES.CONVERTED,
        constants_1.LEAD_STATUSES.LOST,
    ]).default(constants_1.LEAD_STATUSES.NEW),
    estimatedValue: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
});
// Support Ticket Schema
exports.supportTicketCreateSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5, 'Subject is required'),
    description: zod_1.z.string().min(10, 'Detailed description is required'),
    category: zod_1.z.string().min(2, 'Category is required'),
    priority: zod_1.z.enum([
        constants_1.TICKET_PRIORITIES.LOW,
        constants_1.TICKET_PRIORITIES.MEDIUM,
        constants_1.TICKET_PRIORITIES.HIGH,
        constants_1.TICKET_PRIORITIES.URGENT,
    ]).default(constants_1.TICKET_PRIORITIES.MEDIUM),
});
//# sourceMappingURL=index.js.map