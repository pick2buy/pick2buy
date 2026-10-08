import { z } from 'zod';
import { ROLES, ORDER_STATUSES, PAYMENT_METHODS, PRODUCT_STATUSES, LEAD_STATUSES, TICKET_PRIORITIES, TICKET_STATUSES, COUPON_TYPES } from '../constants';

// Authentication Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().regex(/^\d{6}$/, 'Enter the six-digit code'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Address Schema
export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number is required'),
  email: z.string().email().optional().or(z.literal('')),
  addressLine: z.string().min(5, 'Address line is required'),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code is required'),
  isDefault: z.boolean().default(false),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
});

// Checkout Schema
export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum([
    PAYMENT_METHODS.COD,
    PAYMENT_METHODS.RAZORPAY_UPI,
    PAYMENT_METHODS.RAZORPAY_CARD,
    PAYMENT_METHODS.RAZORPAY_NETBANKING,
    PAYMENT_METHODS.RAZORPAY_WALLET,
  ]),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Product Schemas
export const productCreateSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  slug: z.string().min(3).optional(),
  sku: z.string().min(2, 'SKU is required'),
  description: z.string().min(10, 'Detailed description is required'),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  mrp: z.number().min(0, 'MRP must be positive'),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().default(5),
  status: z.enum([PRODUCT_STATUSES.DRAFT, PRODUCT_STATUSES.ACTIVE, PRODUCT_STATUSES.OUT_OF_STOCK, PRODUCT_STATUSES.ARCHIVED]).default(PRODUCT_STATUSES.ACTIVE),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isFlashDeal: z.boolean().default(false),
  flashDealEnd: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  specifications: z.record(z.string()).default({}),
  images: z.array(
    z.object({
      url: z.string().url('Invalid image URL'),
      altText: z.string().optional(),
      isPrimary: z.boolean().default(false),
    })
  ).default([]),
  variants: z.array(
    z.object({
      sku: z.string().min(2),
      name: z.string().min(1),
      size: z.string().optional(),
      color: z.string().optional(),
      material: z.string().optional(),
      storage: z.string().optional(),
      price: z.number().min(0),
      mrp: z.number().min(0),
      stock: z.number().int().min(0),
      imageUrl: z.string().url().optional(),
    })
  ).default([]),
});

// Category Schema
export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  parentId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

// Review Schema
export const reviewCreateSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
  images: z.array(z.string().url()).optional(),
});

// Coupon Schema
export const couponCreateSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  type: z.enum([COUPON_TYPES.PERCENTAGE, COUPON_TYPES.FIXED, COUPON_TYPES.FREE_SHIPPING]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).default(1),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
  isFirstOrderOnly: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
});

// Lead Schema
export const leadCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  source: z.string().default('WEBSITE'),
  productInterest: z.string().optional(),
  status: z.enum([
    LEAD_STATUSES.NEW,
    LEAD_STATUSES.CONTACTED,
    LEAD_STATUSES.QUALIFIED,
    LEAD_STATUSES.CONVERTED,
    LEAD_STATUSES.LOST,
  ]).default(LEAD_STATUSES.NEW),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
});

// Support Ticket Schema
export const supportTicketCreateSchema = z.object({
  subject: z.string().min(5, 'Subject is required'),
  description: z.string().min(10, 'Detailed description is required'),
  category: z.string().min(2, 'Category is required'),
  priority: z.enum([
    TICKET_PRIORITIES.LOW,
    TICKET_PRIORITIES.MEDIUM,
    TICKET_PRIORITIES.HIGH,
    TICKET_PRIORITIES.URGENT,
  ]).default(TICKET_PRIORITIES.MEDIUM),
});
