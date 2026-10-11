import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthChallenge, useAuthStore } from '../store/useAuthStore';
import { GoogleSignIn } from '../components/common/GoogleSignIn';
import { EmailCodeForm } from '../components/common/EmailCodeForm';

type RegisterField = 'name' | 'email' | 'phone' | 'password';
type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, googleLogin, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: searchParams.get('email') || '',
    phone: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<AuthChallenge | null>(null);

  const updateField = (field: RegisterField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _, ...remaining } = current;
      return remaining;
    });
  };

  const validateForm = (): RegisterFieldErrors => {
    const errors: RegisterFieldErrors = {};
    if (!/^(?=(?:.*\p{L}){2,})\p{L}(?:[\p{L}\s'-]*\p{L})?$/u.test(form.name.trim())) {
      errors.name = 'Enter a valid full name using at least two letters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Please enter a valid email address';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }
    try {
      const pending = await registerUser(form);
      setForm((current) => ({ ...current, password: '' }));
      setChallenge(pending);
    } catch (err: any) {
      const errors = (err.errors || []) as string[];
      const serverFieldErrors = errors.reduce<RegisterFieldErrors>((result, entry) => {
        const match = entry.match(/^(name|email|phone|password):\s*(.+)$/i);
        if (match) result[match[1].toLowerCase() as RegisterField] = match[2];
        return result;
      }, {});
      if (Object.keys(serverFieldErrors).length) {
        setFieldErrors(serverFieldErrors);
      } else {
        setErrorMessage(err.message || 'Registration failed.');
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-10 sm:py-14">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:px-12 sm:py-9 shadow-soft space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-primary font-black text-xl flex items-center justify-center mx-auto mb-3">
            P2B
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500">Join Pick2Buy for exclusive deals & instant order tracking</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {errorMessage}
          </div>
        )}

        {challenge ? <EmailCodeForm challenge={challenge} onVerified={() => navigate('/')}
          onBack={() => { setChallenge(null); setErrorMessage(''); }} /> : <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                id="register-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Aarav Sharma"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-primary ${fieldErrors.name ? 'border-rose-400' : 'border-slate-200'}`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {fieldErrors.name && <p id="register-name-error" className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="register-email" className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                id="register-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="name@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-primary ${fieldErrors.email ? 'border-rose-400' : 'border-slate-200'}`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {fieldErrors.email && <p id="register-email-error" className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="register-phone" className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (Optional)</label>
            <div className="relative">
              <input
                id="register-phone"
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="9820112233"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-brand-primary ${fieldErrors.phone ? 'border-rose-400' : 'border-slate-200'}`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {fieldErrors.phone && <p id="register-phone-error" className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 chars)</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-12 py-2.5 text-xs outline-none focus:border-brand-primary ${fieldErrors.password ? 'border-rose-400' : 'border-slate-200'}`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && <p id="register-password-error" className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>}

        {!challenge && import.meta.env.VITE_GOOGLE_CLIENT_ID && <>
          <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px bg-slate-200 flex-1" />or<span className="h-px bg-slate-200 flex-1" /></div>
          <GoogleSignIn text="signup_with" onCredential={async (credential) => { await googleLogin(credential); navigate('/'); }} />
        </>}

        {!challenge && <div className="text-center pt-2 text-xs text-slate-500">
          <span>Already registered? </span>
          <Link to="/login" className="font-bold text-brand-primary hover:underline">
            Sign in
          </Link>
        </div>}
      </div>
    </div>
  );
};
