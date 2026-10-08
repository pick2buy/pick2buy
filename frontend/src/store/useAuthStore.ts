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
  googleLinked?: boolean;
}

export interface AuthChallenge {
  challengeId: string;
  email: string;
  expiresIn: number;
  resendAfter: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  login: (credentials: any) => Promise<AuthChallenge>;
  register: (payload: any) => Promise<AuthChallenge>;
  verifyCode: (challengeId: string, code: string) => Promise<void>;
  resendCode: (challengeId: string) => Promise<AuthChallenge>;
  googleLogin: (credential: string) => Promise<void>;
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
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.register(payload);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyCode: async (challengeId, code) => {
    set({ isLoading: true });
    try {
      const res = await api.verifyCode(challengeId, code);
      const { user, accessToken } = res.data;
      localStorage.setItem('pick2buy_token', accessToken);
      set({ user, token: accessToken, isLoading: false, hasCheckedAuth: true });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  resendCode: async (challengeId) => {
    set({ isLoading: true });
    try {
      const res = await api.resendCode(challengeId);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true });
    try {
      const res = await api.googleLogin(credential);
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
