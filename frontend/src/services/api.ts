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
  public checkEmail(email: string): Promise<{ success: boolean; data: { exists: boolean } }> {
    return this.request('/auth/check-email', { method: 'POST', body: JSON.stringify({ email }) });
  }

  public login(credentials: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  public register(payload: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  }

  public verifyCode(challengeId: string, code: string) {
    return this.request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ challengeId, code }) });
  }

  public resendCode(challengeId: string) {
    return this.request('/auth/resend-code', { method: 'POST', body: JSON.stringify({ challengeId }) });
  }

  public requestPasswordReset(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  }

  public resetPassword(email: string, code: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  public googleLogin(credential: string) {
    return this.request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
  }

  public linkGoogle(credential: string) {
    return this.request('/auth/google/link', { method: 'POST', body: JSON.stringify({ credential }) });
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

  public updateProduct(id: string, payload: any) {
    return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public archiveProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
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

  public getAdminCategories() { return this.request('/admin/categories'); }
  public createCategory(payload: any) { return this.request('/categories', { method: 'POST', body: JSON.stringify(payload) }); }
  public updateCategory(id: string, payload: any) { return this.request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
  public deleteCategory(id: string) { return this.request(`/categories/${id}`, { method: 'DELETE' }); }
  public getAdminBrands() { return this.request('/admin/brands'); }
  public createBrand(payload: any) { return this.request('/admin/brands', { method: 'POST', body: JSON.stringify(payload) }); }
  public updateBrand(id: string, payload: any) { return this.request(`/admin/brands/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
  public deleteBrand(id: string) { return this.request(`/admin/brands/${id}`, { method: 'DELETE' }); }

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
  public getPaymentOptions() {
    return this.request('/orders/payment-options');
  }

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
    const guestToken = localStorage.getItem(`pick2buy_order_${orderNumber}`);
    return this.request(`/orders/${encodeURIComponent(orderNumber)}`, {
      headers: guestToken ? { 'x-order-access': guestToken } : {},
    });
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

  public getAdminOrders(params: { page: number; q: string; status: string }) {
    return this.request(`/admin/orders?${new URLSearchParams({ page: String(params.page), q: params.q, status: params.status })}`);
  }

  public getAdminProducts() { return this.request('/admin/products'); }

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

  public getActiveBanners() { return this.request('/banners'); }
  public createBanner(payload: any) { return this.request('/admin/banners', { method: 'POST', body: JSON.stringify(payload) }); }
  public updateBanner(id: string, payload: any) { return this.request(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
  public deleteBanner(id: string) { return this.request(`/admin/banners/${id}`, { method: 'DELETE' }); }

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
