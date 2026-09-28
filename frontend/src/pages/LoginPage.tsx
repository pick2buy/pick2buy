import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    }
  };

  const fillAdmin = () => {
    setEmail('admin@pick2buy.in');
    setPassword('ChangeMe123!');
  };

  const fillCustomer = () => {
    setEmail('aarav.sharma@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-primary font-black text-xl flex items-center justify-center mx-auto mb-3">
            P2B
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to access your Pick2Buy orders & wishlist</p>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
            <ShieldCheck className="w-4 h-4" />
            <span>Development Quick-Login:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={fillAdmin}
              className="text-[11px] font-bold bg-white text-indigo-950 border border-indigo-200 py-1.5 px-2 rounded-xl hover:bg-indigo-50 transition-colors text-center"
            >
              Demo Admin ⚡
            </button>
            <button
              type="button"
              onClick={fillCustomer}
              className="text-[11px] font-bold bg-white text-slate-800 border border-slate-200 py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-colors text-center"
            >
              Demo Customer 👤
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-primary"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-primary"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          <span>Don't have an account? </span>
          <Link to="/register" className="font-bold text-brand-primary hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
