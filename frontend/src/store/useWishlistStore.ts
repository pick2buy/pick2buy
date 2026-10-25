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
    const previousItems = get().items;
    const alreadyWishlisted = previousItems.some((item) => item.productId === productId);

    // Update locally first so hearts and wishlist counts respond at tap time.
    // The server remains the source of truth and restores the full list below.
    set({
      items: alreadyWishlisted
        ? previousItems.filter((item) => item.productId !== productId)
        : [...previousItems, { id: `optimistic-${productId}`, productId }],
    });

    try {
      const res = await api.toggleWishlist(productId);
      void get().fetchWishlist();
      return res.action === 'added';
    } catch (err) {
      set({ items: previousItems });
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
