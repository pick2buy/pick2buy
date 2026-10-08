import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { OtpCodeInput } from '../components/common/OtpCodeInput';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [code, setCode] = useState('');
  const [inputVersion, setInputVersion] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
  }, []);

  useEffect(() => {
    if (step !== 'reset') return;
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, step]);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const normalized = email.trim().toLowerCase();
      await api.requestPasswordReset(normalized);
      setEmail(normalized);
      setStep('reset');
      setCode('');
      setInputVersion((version) => version + 1);
      setRetryAt(Date.now() + 60_000);
      setSeconds(60);
      setNotice('If this email has an account, a code will arrive shortly. Check your inbox and Spam folder.');
    } catch (err: any) {
      setError(err.message || 'Could not request a reset code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Enter the six-digit code from your email.'); return; }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.resetPassword(email, code, password);
      setPassword('');
      setConfirmation('');
      setStep('done');
      navigationTimer.current = window.setTimeout(() => navigate(`/login?email=${encodeURIComponent(email)}`), 2500);
    } catch (err: any) {
      setError(err.message || 'Could not reset your password. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card rounded-3xl border border-slate-100 bg-white shadow-soft">
        {step === 'done' ? (
          <div role="status" aria-live="polite" className="login-form space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Password updated</h1>
            <p className="text-sm text-slate-600">Your new password is ready. Taking you to sign in...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reset password</h1>
              <p className="text-sm text-slate-600">
                {step === 'email' ? 'Enter your email to receive a verification code.' : <>Enter the code sent to <strong className="break-all text-slate-900">{email}</strong> and choose a new password.</>}
              </p>
            </div>
            {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            {notice && <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
            {step === 'email' ? (
              <form onSubmit={requestCode} className="login-form space-y-3">
                <div>
                  <label htmlFor="recovery-email" className="mb-1 block text-sm font-medium text-slate-800">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="recovery-email" type="email" autoComplete="email" required autoFocus
                      value={email} onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="login-input w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
                <button type="submit" disabled={busy}
                  className="login-submit flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50">
                  {busy ? 'Sending...' : 'Send verification code'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="login-form space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">Verification code</label>
                  <OtpCodeInput key={inputVersion} autoFocus onChange={setCode} disabled={busy} />
                  <p className="mt-2 text-xs text-slate-500">The code expires in 10 minutes and works once.</p>
                </div>
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-800">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                      minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className="login-input w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-12 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-800">Confirm new password</label>
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="Enter it again"
                    className="login-input w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary" />
                </div>
                <button type="submit" disabled={busy || code.length !== 6}
                  className="login-submit flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50">
                  {busy ? 'Updating...' : 'Reset password'} <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <button type="button" onClick={() => { setStep('email'); setError(''); setNotice(''); }} className="text-slate-600 hover:underline">Change email</button>
                  <button type="button" onClick={() => void requestCode()} disabled={busy || seconds > 0}
                    className="font-semibold text-brand-primary disabled:text-slate-400">
                    {seconds > 0 ? `Resend in ${seconds}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
            <Link to="/login" className="login-bottom-link flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
