import { create } from 'zustand';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };
type Confirmation = { title: string; message: string; confirmLabel: string; destructive: boolean; resolve: (confirmed: boolean) => void };
type ToastState = {
  items: ToastItem[];
  confirmation: Confirmation | null;
  add: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
  ask: (options: Omit<Confirmation, 'resolve'>) => Promise<boolean>;
  answer: (confirmed: boolean) => void;
};

let nextToastId = 0;
export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  confirmation: null,
  add: (kind, message) => {
    const id = ++nextToastId;
    set(state => ({ items: [...state.items.slice(-2), { id, kind, message }] }));
    window.setTimeout(() => get().dismiss(id), kind === 'error' ? 6500 : 4500);
  },
  dismiss: id => set(state => ({ items: state.items.filter(item => item.id !== id) })),
  ask: options => new Promise(resolve => set({ confirmation: { ...options, resolve } })),
  answer: confirmed => {
    const pending = get().confirmation;
    set({ confirmation: null });
    pending?.resolve(confirmed);
  },
}));

export const toast = {
  success: (message: string) => useToastStore.getState().add('success', message),
  error: (message: string) => useToastStore.getState().add('error', message),
  info: (message: string) => useToastStore.getState().add('info', message),
};

export const confirmAction = (title: string, message: string, confirmLabel = 'Confirm', destructive = false) =>
  useToastStore.getState().ask({ title, message, confirmLabel, destructive });
