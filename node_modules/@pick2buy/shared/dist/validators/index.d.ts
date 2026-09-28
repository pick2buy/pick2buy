import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const addressSchema: z.ZodObject<{
    fullName: z.ZodString;
    mobile: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    addressLine: z.ZodString;
    apartment: z.ZodOptional<z.ZodString>;
    landmark: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    type: z.ZodDefault<z.ZodEnum<["HOME", "WORK", "OTHER"]>>;
}, "strip", z.ZodTypeAny, {
    type: "HOME" | "WORK" | "OTHER";
    fullName: string;
    mobile: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    email?: string | undefined;
    apartment?: string | undefined;
    landmark?: string | undefined;
}, {
    fullName: string;
    mobile: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    email?: string | undefined;
    type?: "HOME" | "WORK" | "OTHER" | undefined;
    apartment?: string | undefined;
    landmark?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const checkoutSchema: z.ZodObject<{
    shippingAddress: z.ZodObject<{
        fullName: z.ZodString;
        mobile: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        addressLine: z.ZodString;
        apartment: z.ZodOptional<z.ZodString>;
        landmark: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        isDefault: z.ZodDefault<z.ZodBoolean>;
        type: z.ZodDefault<z.ZodEnum<["HOME", "WORK", "OTHER"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "HOME" | "WORK" | "OTHER";
        fullName: string;
        mobile: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        isDefault: boolean;
        email?: string | undefined;
        apartment?: string | undefined;
        landmark?: string | undefined;
    }, {
        fullName: string;
        mobile: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        email?: string | undefined;
        type?: "HOME" | "WORK" | "OTHER" | undefined;
        apartment?: string | undefined;
        landmark?: string | undefined;
        isDefault?: boolean | undefined;
    }>;
    paymentMethod: z.ZodEnum<["COD", "RAZORPAY_UPI", "RAZORPAY_CARD", "RAZORPAY_NETBANKING", "RAZORPAY_WALLET"]>;
    couponCode: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shippingAddress: {
        type: "HOME" | "WORK" | "OTHER";
        fullName: string;
        mobile: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        isDefault: boolean;
        email?: string | undefined;
        apartment?: string | undefined;
        landmark?: string | undefined;
    };
    paymentMethod: "COD" | "RAZORPAY_UPI" | "RAZORPAY_CARD" | "RAZORPAY_NETBANKING" | "RAZORPAY_WALLET";
    couponCode?: string | undefined;
    notes?: string | undefined;
}, {
    shippingAddress: {
        fullName: string;
        mobile: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        email?: string | undefined;
        type?: "HOME" | "WORK" | "OTHER" | undefined;
        apartment?: string | undefined;
        landmark?: string | undefined;
        isDefault?: boolean | undefined;
    };
    paymentMethod: "COD" | "RAZORPAY_UPI" | "RAZORPAY_CARD" | "RAZORPAY_NETBANKING" | "RAZORPAY_WALLET";
    couponCode?: string | undefined;
    notes?: string | undefined;
}>;
export declare const productCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    brandId: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    mrp: z.ZodNumber;
    costPrice: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodNumber;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]>>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    isBestSeller: z.ZodDefault<z.ZodBoolean>;
    isTrending: z.ZodDefault<z.ZodBoolean>;
    isFlashDeal: z.ZodDefault<z.ZodBoolean>;
    flashDealEnd: z.ZodOptional<z.ZodString>;
    highlights: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    specifications: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    images: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        altText: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        isPrimary: boolean;
        altText?: string | undefined;
    }, {
        url: string;
        altText?: string | undefined;
        isPrimary?: boolean | undefined;
    }>, "many">>;
    variants: z.ZodDefault<z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        name: z.ZodString;
        size: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
        material: z.ZodOptional<z.ZodString>;
        storage: z.ZodOptional<z.ZodString>;
        price: z.ZodNumber;
        mrp: z.ZodNumber;
        stock: z.ZodNumber;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        sku: string;
        price: number;
        mrp: number;
        stock: number;
        size?: string | undefined;
        color?: string | undefined;
        material?: string | undefined;
        storage?: string | undefined;
        imageUrl?: string | undefined;
    }, {
        name: string;
        sku: string;
        price: number;
        mrp: number;
        stock: number;
        size?: string | undefined;
        color?: string | undefined;
        material?: string | undefined;
        storage?: string | undefined;
        imageUrl?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
    sku: string;
    description: string;
    categoryId: string;
    price: number;
    mrp: number;
    stock: number;
    lowStockThreshold: number;
    isFeatured: boolean;
    isBestSeller: boolean;
    isTrending: boolean;
    isFlashDeal: boolean;
    highlights: string[];
    specifications: Record<string, string>;
    images: {
        url: string;
        isPrimary: boolean;
        altText?: string | undefined;
    }[];
    variants: {
        name: string;
        sku: string;
        price: number;
        mrp: number;
        stock: number;
        size?: string | undefined;
        color?: string | undefined;
        material?: string | undefined;
        storage?: string | undefined;
        imageUrl?: string | undefined;
    }[];
    slug?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    costPrice?: number | undefined;
    flashDealEnd?: string | undefined;
}, {
    name: string;
    sku: string;
    description: string;
    categoryId: string;
    price: number;
    mrp: number;
    stock: number;
    status?: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED" | undefined;
    slug?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    costPrice?: number | undefined;
    lowStockThreshold?: number | undefined;
    isFeatured?: boolean | undefined;
    isBestSeller?: boolean | undefined;
    isTrending?: boolean | undefined;
    isFlashDeal?: boolean | undefined;
    flashDealEnd?: string | undefined;
    highlights?: string[] | undefined;
    specifications?: Record<string, string> | undefined;
    images?: {
        url: string;
        altText?: string | undefined;
        isPrimary?: boolean | undefined;
    }[] | undefined;
    variants?: {
        name: string;
        sku: string;
        price: number;
        mrp: number;
        stock: number;
        size?: string | undefined;
        color?: string | undefined;
        material?: string | undefined;
        storage?: string | undefined;
        imageUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const categoryCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    bannerUrl: z.ZodOptional<z.ZodString>;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    featured: z.ZodDefault<z.ZodBoolean>;
    displayOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    featured: boolean;
    displayOrder: number;
    slug?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
    bannerUrl?: string | undefined;
    parentId?: string | null | undefined;
}, {
    name: string;
    slug?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
    bannerUrl?: string | undefined;
    parentId?: string | null | undefined;
    featured?: boolean | undefined;
    displayOrder?: number | undefined;
}>;
export declare const reviewCreateSchema: z.ZodObject<{
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    comment: z.ZodString;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    comment: string;
    images?: string[] | undefined;
    title?: string | undefined;
}, {
    rating: number;
    comment: string;
    images?: string[] | undefined;
    title?: string | undefined;
}>;
export declare const couponCreateSchema: z.ZodObject<{
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["PERCENTAGE", "FIXED", "FREE_SHIPPING"]>;
    value: z.ZodNumber;
    minOrderValue: z.ZodOptional<z.ZodNumber>;
    maxDiscount: z.ZodOptional<z.ZodNumber>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    perUserLimit: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isFirstOrderOnly: z.ZodDefault<z.ZodBoolean>;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    perUserLimit: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isFirstOrderOnly: boolean;
    description?: string | undefined;
    categoryId?: string | null | undefined;
    minOrderValue?: number | undefined;
    maxDiscount?: number | undefined;
    usageLimit?: number | undefined;
}, {
    value: number;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    startDate: string;
    endDate: string;
    description?: string | undefined;
    categoryId?: string | null | undefined;
    minOrderValue?: number | undefined;
    maxDiscount?: number | undefined;
    usageLimit?: number | undefined;
    perUserLimit?: number | undefined;
    isActive?: boolean | undefined;
    isFirstOrderOnly?: boolean | undefined;
}>;
export declare const leadCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodString>;
    productInterest: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]>>;
    estimatedValue: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
    source: string;
    phone?: string | undefined;
    notes?: string | undefined;
    productInterest?: string | undefined;
    estimatedValue?: number | undefined;
}, {
    name: string;
    email: string;
    phone?: string | undefined;
    status?: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | undefined;
    notes?: string | undefined;
    source?: string | undefined;
    productInterest?: string | undefined;
    estimatedValue?: number | undefined;
}>;
export declare const supportTicketCreateSchema: z.ZodObject<{
    subject: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    subject: string;
    category: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}, {
    description: string;
    subject: string;
    category: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
}>;
//# sourceMappingURL=index.d.ts.map