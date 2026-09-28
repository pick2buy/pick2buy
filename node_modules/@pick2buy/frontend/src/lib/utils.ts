import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSessionId(): string {
  let sessionId = localStorage.getItem('pick2buy_session_id');
  if (!sessionId) {
    sessionId = 'p2b_sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('pick2buy_session_id', sessionId);
  }
  return sessionId;
}
