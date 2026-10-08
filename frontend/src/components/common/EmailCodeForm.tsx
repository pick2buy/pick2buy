import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { AuthChallenge, useAuthStore } from '../../store/useAuthStore';
import { OtpCodeInput } from './OtpCodeInput';

interface Props {
  challenge: AuthChallenge;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailCodeForm: React.FC<Props> = ({ challenge, onVerified, onBack }) => {
  const { verifyCode, resendCode, isLoading } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);
  const [retryAt, setRetryAt] = useState(Date.now() + challenge.resendAfter * 1000);
  const [expiresAt, setExpiresAt] = useState(Date.now() + challenge.expiresIn * 1000);
  const [seconds, setSeconds] = useState(challenge.resendAfter);
  const [expiresIn, setExpiresIn] = useState(challenge.expiresIn);
  const [inputVersion, setInputVersion] = useState(0);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
      setExpiresIn(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, expiresAt]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (code.length !== 6) { setError('Enter the six-digit code.'); return; }
    try {
      await verifyCode(challenge.challengeId, code);
      setVerified(true);
      navigationTimer.current = window.setTimeout(onVerified, 2500);
    } catch (err: any) {
      setError(err.message || 'Could not verify the code.');
    }
  };

  const resend = async () => {
    setError('');
    setNotice('');
    try {
      const next = await resendCode(challenge.challengeId);
      setCode('');
      setInputVersion((version) => version + 1);
      setRetryAt(Date.now() + next.resendAfter * 1000);
      setExpiresAt(Date.now() + next.expiresIn * 1000);
      setSeconds(next.resendAfter);
      setExpiresIn(next.expiresIn);
      setNotice('A new code was sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Could not resend the code.');
    }
  };

  if (verified) {
    return (
      <div role="status" aria-live="polite" className="login-form rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <h2 className="text-lg font-bold text-green-900">Verification successful!</h2>
        <p className="mt-1 text-sm text-green-800">Your email is verified. Taking you to the home page...</p>
      </div>
    );
  }

  return (
    <div className="login-form space-y-3">
      <div className="space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
        <p className="text-sm leading-6 text-slate-600">
          Enter the six-digit code sent to <strong className="break-all text-slate-900">{challenge.email}</strong>.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Verification code</label>
          <OtpCodeInput key={inputVersion} autoFocus onChange={setCode} disabled={isLoading} />
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            {expiresIn > 0 ? `Code expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}` : 'Code expired. Start again to get a new one.'}
          </div>
        </div>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
        <button type="submit" disabled={isLoading || code.length !== 6 || expiresIn === 0}
          className="login-submit w-full bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {isLoading ? 'Verifying...' : 'Verify code'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-slate-600 hover:underline">Change email</button>
        <button type="button" onClick={resend} disabled={isLoading || seconds > 0}
          className="font-semibold text-brand-primary disabled:text-slate-400">
          {seconds > 0 ? `Resend in ${seconds}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
};
