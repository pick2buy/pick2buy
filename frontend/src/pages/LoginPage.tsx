import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { AuthChallenge, useAuthStore } from '../store/useAuthStore';
import { GoogleSignIn } from '../components/common/GoogleSignIn';
import { EmailCodeForm } from '../components/common/EmailCodeForm';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const { login, googleLogin, isLoading } = useAuthStore();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password' | 'code'>(initialEmail ? 'password' : 'email');
  const [challenge, setChallenge] = useState<AuthChallenge | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setCheckingEmail(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await api.checkEmail(normalizedEmail);
      if (response.data.exists) {
        setEmail(normalizedEmail);
        setStep('password');
      } else {
        navigate(`/register?email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not check this email. Please try again.');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const pending = await login({ email, password });
      setPassword('');
      setChallenge(pending);
      setStep('code');
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign in failed. Please check your password.');
    }
  };

  const useDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
    setStep('password');
  };

  return (
    <div className="login-page">
      <div className="login-card bg-white rounded-3xl border border-slate-100 shadow-soft">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Log in</h1>
          <p className="text-sm text-slate-600">Continue to Pick2Buy</p>
        </div>

        {errorMessage && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{errorMessage}</div>}

        {step === 'code' && challenge ? (
          <EmailCodeForm challenge={challenge} onVerified={() => navigate('/')}
            onBack={() => { setChallenge(null); setStep('email'); setErrorMessage(''); }} />
        ) : step === 'email' ? (
          <form onSubmit={handleEmail} className="login-form space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-800 mb-1">Email</label>
              <div className="relative">
                <input id="login-email" type="email" autoComplete="email" required autoFocus value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                  className="login-input w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <button type="submit" disabled={checkingEmail}
              className="login-submit w-full bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {checkingEmail ? 'Checking email...' : 'Continue with email'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="login-form space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm">
              <span className="truncate text-slate-700">{email}</span>
              <button type="button" onClick={() => { setStep('email'); setPassword(''); setShowPassword(false); setErrorMessage(''); }} className="shrink-0 font-semibold text-brand-primary hover:underline">Change</button>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-800 mb-1">Password</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required autoFocus value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                  className="login-input w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link to={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-sm font-semibold text-brand-primary hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" disabled={isLoading}
              className="login-submit w-full bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {isLoading ? 'Signing in...' : 'Sign in'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step !== 'code' && import.meta.env.VITE_GOOGLE_CLIENT_ID && <>
          <div className="login-divider flex items-center gap-3 text-xs text-slate-500"><span className="h-px bg-slate-200 flex-1" />or<span className="h-px bg-slate-200 flex-1" /></div>
          <div className="login-google"><GoogleSignIn onCredential={async (credential) => { await googleLogin(credential); navigate('/'); }} /></div>
        </>}

        {step !== 'code' && <div className="login-bottom-link text-sm text-slate-600">
          New to Pick2Buy? <Link to={email ? `/register?email=${encodeURIComponent(email.trim())}` : '/register'} className="font-semibold text-brand-primary hover:underline">Create an account →</Link>
        </div>}

      </div>

        {import.meta.env.DEV && <details className="login-demo text-xs text-slate-500">
          <summary className="cursor-pointer flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Development demo accounts</summary>
          <div className="flex gap-2 pt-3">
            <button type="button" onClick={() => useDemo('admin@pick2buy.in', 'ChangeMe123!')} className="flex-1 rounded-lg border border-slate-200 px-2 py-2 font-semibold text-slate-800">Demo Admin</button>
            <button type="button" onClick={() => useDemo('aarav.sharma@example.com', 'Password123!')} className="flex-1 rounded-lg border border-slate-200 px-2 py-2 font-semibold text-slate-800">Demo Customer</button>
          </div>
        </details>}
    </div>
  );
};
