import { create } from 'zustand';
import { api } from '../services/api';

const quantitySyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingQuantities = new Map<string, number>();
const pendingRemovals = new Set<string>();

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
  pendingItemCount: number;
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

const withOptimisticQuantity = (cart: CartSummary, itemId: string, quantity: number): CartSummary => {
  const items = cart.items
    .filter((item) => item.id !== itemId || quantity > 0)
    .map((item) => item.id === itemId ? { ...item, quantity, totalPrice: item.unitPrice * quantity } : item);
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
  const totalMrp = items.reduce((total, item) => total + (item.variant?.mrp ?? item.product.mrp) * item.quantity, 0);
  const shipping = subtotal > 499 || subtotal === 0 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const discount = Math.max(0, totalMrp - subtotal);

  return {
    ...cart,
    items,
    subtotal,
    totalMrp,
    tax,
    discount,
    shipping,
    // The server recalculates coupon eligibility after the brief debounce.
    grandTotal: Math.max(0, subtotal + shipping - cart.couponDiscount),
  };
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  pendingItemCount: 0,
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
    set((state) => ({ isLoading: true, pendingItemCount: state.pendingItemCount + quantity }));
    try {
      const res = await api.addToCart(productId, variantId, quantity);
      set({ cart: res.data, isLoading: false, pendingItemCount: 0, isCartDrawerOpen: true });
    } catch (err) {
      set((state) => ({ isLoading: false, pendingItemCount: Math.max(0, state.pendingItemCount - quantity) }));
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    const item = get().cart?.items.find((cartItem) => cartItem.id === itemId);
    if (!item) return;

    const availableStock = item.variant?.stock ?? item.product.stock;
    const nextQuantity = Math.max(0, Math.min(99, availableStock, quantity));
    if (nextQuantity === item.quantity) return;

    // Update the visible bag immediately. Rapid taps are consolidated below so
    // the API only receives the final requested quantity.
    set((state) => ({
      cart: state.cart ? withOptimisticQuantity(state.cart, itemId, nextQuantity) : null,
    }));
    pendingQuantities.set(itemId, nextQuantity);

    const existingTimer = quantitySyncTimers.get(itemId);
    if (existingTimer) clearTimeout(existingTimer);
    quantitySyncTimers.set(itemId, setTimeout(async () => {
      quantitySyncTimers.delete(itemId);
      const requestedQuantity = pendingQuantities.get(itemId);
      if (requestedQuantity === undefined) return;

      try {
        const response = await api.updateCartItem(itemId, requestedQuantity);
        // Ignore an older response if the shopper tapped again while it was in flight.
        if (pendingQuantities.get(itemId) === requestedQuantity) {
          pendingQuantities.delete(itemId);
          if (pendingRemovals.size === 0) set({ cart: response.data });
        }
      } catch {
        if (pendingQuantities.get(itemId) === requestedQuantity) {
          pendingQuantities.delete(itemId);
          // Restore the server-confirmed cart if the quantity changed elsewhere
          // or stock changed while the shopper was tapping.
          if (pendingRemovals.size === 0) void get().fetchCart();
        }
      }
    }, 180));
  },

  removeItem: async (itemId) => {
    if (!get().cart?.items.some((item) => item.id === itemId) || pendingRemovals.has(itemId)) return;
    const pendingTimer = quantitySyncTimers.get(itemId);
    if (pendingTimer) clearTimeout(pendingTimer);
    quantitySyncTimers.delete(itemId);
    pendingQuantities.delete(itemId);
    pendingRemovals.add(itemId);
    set((state) => ({
      cart: state.cart ? withOptimisticQuantity(state.cart, itemId, 0) : null,
    }));
    try {
      await api.removeCartItem(itemId);
    } finally {
      pendingRemovals.delete(itemId);
      // Use one authoritative refresh after all active removals finish. This
      // avoids a slower delete response restoring another item in the UI.
      if (pendingRemovals.size === 0) void get().fetchCart();
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
