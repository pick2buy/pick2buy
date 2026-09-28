import { getSessionId } from '../lib/utils';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('pick2buy_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const sessionId = getSessionId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.errors?.[0] || 'An error occurred';
      throw new Error(errorMsg);
    }

    return data;
  }

  // Auth
  public login(credentials: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  public register(payload: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  }

  public getMe() {
    return this.request('/auth/me');
  }

  // Products
  public getProducts(params?: Record<string, any>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    return this.request(`/products?${query.toString()}`);
  }

  public getProduct(slugOrId: string) {
    return this.request(`/products/${slugOrId}`);
  }

  public createProduct(payload: any) {
    return this.request('/products', { method: 'POST', body: JSON.stringify(payload) });
  }

  public checkPincode(pincode: string) {
    return this.request(`/products/check-pincode/${pincode}`);
  }

  // Categories
  public getCategories() {
    return this.request('/categories');
  }

  public getCategory(slug: string) {
    return this.request(`/categories/${slug}`);
  }

  // Cart
  public getCart(couponCode?: string) {
    const q = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : '';
    return this.request(`/cart${q}`);
  }

  public addToCart(productId: string, variantId?: string | null, quantity: number = 1) {
    return this.request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
    });
  }

  public updateCartItem(itemId: string, quantity: number) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  public removeCartItem(itemId: string) {
    return this.request(`/cart/items/${itemId}`, { method: 'DELETE' });
  }

  // Wishlist
  public getWishlist() {
    return this.request('/wishlist');
  }

  public toggleWishlist(productId: string) {
    return this.request('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  public moveToCart(productId: string) {
    return this.request('/wishlist/move-to-cart', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  // Checkout & Orders
  public checkout(payload: any) {
    return this.request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public verifyPayment(payload: any) {
    return this.request('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public getOrders() {
    return this.request('/orders');
  }

  public getOrderByNumber(orderNumber: string) {
    return this.request(`/orders/${orderNumber}`);
  }

  // Reviews
  public getReviews(productId: string) {
    return this.request(`/reviews/product/${productId}`);
  }

  public submitReview(productId: string, payload: any) {
    return this.request(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin APIs
  public getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  public getAdminInventory() {
    return this.request('/admin/inventory');
  }

  public adjustStock(payload: any) {
    return this.request('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public getAdminCustomers() {
    return this.request('/admin/customers');
  }

  public getAdminLeads() {
    return this.request('/admin/leads');
  }

  public createLead(payload: any) {
    return this.request('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public updateLeadStatus(leadId: string, status: string, note?: string) {
    return this.request(`/admin/leads/${leadId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  public getAdminTickets() {
    return this.request('/admin/tickets');
  }

  public replyTicket(ticketId: string, message: string, status?: string) {
    return this.request(`/admin/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message, status }),
    });
  }

  public getAdminCoupons() {
    return this.request('/admin/coupons');
  }

  public createCoupon(payload: any) {
    return this.request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public deleteCoupon(id: string) {
    return this.request(`/admin/coupons/${id}`, { method: 'DELETE' });
  }

  public getAdminBanners() {
    return this.request('/admin/banners');
  }

  public getAdminAuditLogs() {
    return this.request('/admin/audit-logs');
  }

  public updateOrderStatus(orderId: string, payload: any) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
