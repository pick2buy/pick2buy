import { create } from 'zustand';
import { api } from '../services/api';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    stock: number;
    images?: { url: string }[];
  };
  variant?: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartSummary {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalMrp: number;
  discount: number;
  tax: number;
  shipping: number;
  couponCode?: string | null;
  couponDiscount: number;
  grandTotal: number;
}

interface CartState {
  cart: CartSummary | null;
  isLoading: boolean;
  couponInput: string;
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  setCouponInput: (code: string) => void;
  fetchCart: (coupon?: string) => Promise<void>;
  addItem: (productId: string, variantId?: string | null, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  couponInput: '',
  isCartDrawerOpen: false,

  setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
  setCouponInput: (code) => set({ couponInput: code }),

  fetchCart: async (coupon) => {
    set({ isLoading: true });
    try {
      const appliedCoupon = coupon !== undefined ? coupon : get().cart?.couponCode || undefined;
      const res = await api.getCart(appliedCoupon);
      set({ cart: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const res = await api.addToCart(productId, variantId, quantity);
      set({ cart: res.data, isLoading: false, isCartDrawerOpen: true });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      const res = await api.updateCartItem(itemId, quantity);
      set({ cart: res.data });
    } catch (err) {
      throw err;
    }
  },

  removeItem: async (itemId) => {
    try {
      const res = await api.removeCartItem(itemId);
      set({ cart: res.data });
    } catch (err) {
      throw err;
    }
  },

  applyCoupon: async (code) => {
    const res = await api.getCart(code);
    set({ cart: res.data, couponInput: code });
  },

  removeCoupon: async () => {
    set({ couponInput: '' });
    await get().fetchCart('');
  },
}));
