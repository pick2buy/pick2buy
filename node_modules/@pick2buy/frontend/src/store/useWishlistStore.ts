import { create } from 'zustand';
import { api } from '../services/api';

interface WishlistState {
  items: any[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  moveToCart: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    try {
      const res = await api.getWishlist();
      set({ items: res.data || [] });
    } catch (err) {
      set({ items: [] });
    }
  },

  toggleWishlist: async (productId: string) => {
    try {
      const res = await api.toggleWishlist(productId);
      await get().fetchWishlist();
      return res.action === 'added';
    } catch (err) {
      throw err;
    }
  },

  moveToCart: async (productId: string) => {
    try {
      await api.moveToCart(productId);
      await get().fetchWishlist();
    } catch (err) {
      throw err;
    }
  },

  isWishlisted: (productId: string) => {
    return get().items.some((item) => item.productId === productId);
  },
}));
