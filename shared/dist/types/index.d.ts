import { UserRoleType, OrderStatusType, PaymentMethodType, PaymentStatusType, ProductStatusType, LeadStatusType, TicketStatusType, TicketPriorityType, CouponType } from '../constants';
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface UserDto {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRoleType;
    avatarUrl?: string | null;
    isEmailVerified: boolean;
    dateOfBirth?: string | null;
    createdAt: string;
}
export interface AuthResponseData {
    user: UserDto;
    accessToken: string;
}
export interface AddressDto {
    id: string;
    userId?: string;
    fullName: string;
    mobile: string;
    email?: string | null;
    addressLine: string;
    apartment?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    type?: 'HOME' | 'WORK' | 'OTHER';
}
export interface CategoryDto {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    bannerUrl?: string | null;
    parentId?: string | null;
    featured?: boolean;
    displayOrder?: number;
    children?: CategoryDto[];
    _count?: {
        products?: number;
    };
}
export interface BrandDto {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
}
export interface ProductVariantDto {
    id: string;
    productId: string;
    sku: string;
    name: string;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    storage?: string | null;
    price: number;
    mrp: number;
    stock: number;
    imageUrl?: string | null;
    weight?: number | null;
}
export interface ProductImageDto {
    id: string;
    url: string;
    altText?: string | null;
    isPrimary: boolean;
    displayOrder: number;
}
export interface ProductDto {
    id: string;
    name: string;
    slug: string;
    sku: string;
    description: string;
    shortDescription?: string | null;
    price: number;
    mrp: number;
    costPrice?: number | null;
    discountPercentage?: number;
    taxRate?: number;
    stock: number;
    lowStockThreshold: number;
    status: ProductStatusType;
    isFeatured: boolean;
    isBestSeller: boolean;
    isTrending: boolean;
    isFlashDeal: boolean;
    flashDealEnd?: string | null;
    highlights?: string[];
    specifications?: Record<string, string>;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    categoryId: string;
    category?: CategoryDto;
    brandId?: string | null;
    brand?: BrandDto | null;
    images: ProductImageDto[];
    variants: ProductVariantDto[];
    averageRating: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface CartItemDto {
    id: string;
    productId: string;
    product: ProductDto;
    variantId?: string | null;
    variant?: ProductVariantDto | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export interface CartDto {
    id: string;
    items: CartItemDto[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    couponCode?: string | null;
    couponDiscount: number;
    grandTotal: number;
}
export interface WishlistItemDto {
    id: string;
    productId: string;
    product: ProductDto;
    createdAt: string;
}
export interface OrderItemDto {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productImage?: string | null;
    sku: string;
    variantName?: string | null;
    price: number;
    quantity: number;
    total: number;
}
export interface OrderTimelineDto {
    id: string;
    orderId: string;
    status: OrderStatusType;
    comment?: string | null;
    createdAt: string;
}
export interface OrderDto {
    id: string;
    orderNumber: string;
    userId?: string | null;
    user?: {
        name: string;
        email: string;
        phone?: string | null;
    } | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: AddressDto;
    items: OrderItemDto[];
    status: OrderStatusType;
    paymentMethod: PaymentMethodType;
    paymentStatus: PaymentStatusType;
    paymentId?: string | null;
    trackingNumber?: string | null;
    courierName?: string | null;
    estimatedDeliveryDate?: string | null;
    subtotal: number;
    taxAmount: number;
    shippingFee: number;
    discountAmount: number;
    couponCode?: string | null;
    codFee: number;
    grandTotal: number;
    notes?: string | null;
    timeline: OrderTimelineDto[];
    createdAt: string;
    updatedAt: string;
}
export interface ReviewDto {
    id: string;
    productId: string;
    userId: string;
    user: {
        name: string;
        avatarUrl?: string | null;
    };
    rating: number;
    title?: string | null;
    comment: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    adminReply?: string | null;
    createdAt: string;
}
export interface CouponDto {
    id: string;
    code: string;
    description?: string | null;
    type: CouponType;
    value: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    usedCount: number;
    perUserLimit?: number | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isFirstOrderOnly: boolean;
    categoryId?: string | null;
}
export interface LeadDto {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    source: string;
    productInterest?: string | null;
    status: LeadStatusType;
    estimatedValue?: number | null;
    assignedStaff?: string | null;
    notes?: string | null;
    lastContactedAt?: string | null;
    createdAt: string;
}
export interface SupportTicketDto {
    id: string;
    ticketNumber: string;
    customerId: string;
    customer: {
        name: string;
        email: string;
    };
    subject: string;
    description: string;
    priority: TicketPriorityType;
    category: string;
    status: TicketStatusType;
    assignedAgent?: string | null;
    messages: {
        id: string;
        senderId: string;
        senderName: string;
        senderRole: string;
        message: string;
        createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}
export interface BannerDto {
    id: string;
    title: string;
    subtitle?: string | null;
    desktopImageUrl: string;
    mobileImageUrl?: string | null;
    buttonText?: string | null;
    linkUrl: string;
    displayOrder: number;
    isActive: boolean;
    startDate?: string | null;
    endDate?: string | null;
}
export interface HomepageSectionDto {
    id: string;
    sectionKey: string;
    title: string;
    subtitle?: string | null;
    isEnabled: boolean;
    displayOrder: number;
    configJson?: string | null;
}
export interface DashboardMetricsDto {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    conversionRate: number;
    revenueChart: {
        date: string;
        revenue: number;
        orders: number;
    }[];
    statusDistribution: {
        status: string;
        count: number;
    }[];
    topProducts: {
        id: string;
        name: string;
        sales: number;
        revenue: number;
    }[];
    recentOrders: OrderDto[];
}
//# sourceMappingURL=index.d.ts.map