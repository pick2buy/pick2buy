import { create } from 'zustand';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  addresses?: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  login: (credentials: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('pick2buy_token'),
  isLoading: false,
  hasCheckedAuth: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.login(credentials);
      const { user, accessToken } = res.data;
      localStorage.setItem('pick2buy_token', accessToken);
      set({ user, token: accessToken, isLoading: false, hasCheckedAuth: true });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.register(payload);
      const { user, accessToken } = res.data;
      localStorage.setItem('pick2buy_token', accessToken);
      set({ user, token: accessToken, isLoading: false, hasCheckedAuth: true });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('pick2buy_token');
    set({ user: null, token: null, hasCheckedAuth: true });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('pick2buy_token');
    if (!token) { set({ hasCheckedAuth: true }); return; }
    try {
      const res = await api.getMe();
      if (res.data?.user) {
        set({ user: res.data.user, hasCheckedAuth: true });
      }
    } catch (err) {
      localStorage.removeItem('pick2buy_token');
      set({ user: null, token: null, hasCheckedAuth: true });
    }
  },
}));
