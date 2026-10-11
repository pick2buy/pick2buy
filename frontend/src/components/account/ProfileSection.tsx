import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, CheckCircle2, Mail, Pencil, Trash2 } from 'lucide-react';
import { GoogleSignIn } from '../common/GoogleSignIn';
import { api } from '../../services/api';
import type { AuthChallenge, User } from '../../store/useAuthStore';

interface Props {
  user: User;
  refreshUser: () => Promise<void>;
}

export function ProfileSection({ user, refreshUser }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailChallenge, setEmailChallenge] = useState<AuthChallenge | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [googleMessage, setGoogleMessage] = useState('');

  useEffect(() => {
    if (!resendIn) return;
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn > 0]);

  const resetEdit = () => {
    setName(user.name);
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || null);
    setProfileError('');
    setEditing(false);
  };

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProfileError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8_000_000) {
      setProfileError('Choose a PNG, JPEG, or WebP photo under 8 MB.');
      return;
    }
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo editing is unavailable in this browser.');
      const side = Math.min(image.width, image.height);
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 320, 320);
      image.close();
      let result = canvas.toDataURL('image/jpeg', 0.82);
      if (result.length > 265_000) result = canvas.toDataURL('image/jpeg', 0.6);
      if (result.length > 265_000) throw new Error('Photo is too large. Please try another image.');
      setAvatarUrl(result);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not open this photo.');
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setProfileError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        phone,
        ...(avatarUrl !== (user.avatarUrl || null) ? { avatarUrl } : {}),
      });
      await refreshUser();
      setEditing(false);
      setProfileMessage('Your profile was updated.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const requestEmailChange = async (event: FormEvent) => {
    event.preventDefault();
    setEmailBusy(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const response = await api.requestEmailChange(newEmail.trim());
      setEmailChallenge(response.data);
      setResendIn(response.data.resendAfter || 60);
      setEmailMessage(`A six-digit code was sent to ${response.data.email}.`);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not send the verification code.');
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmailChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailChallenge) return;
    setEmailBusy(true);
    setEmailError('');
    try {
      await api.confirmEmailChange(emailChallenge.challengeId, emailCode);
      await refreshUser();
      setEmailChallenge(null);
      setChangingEmail(false);
      setNewEmail('');
      setEmailCode('');
      setEmailMessage('Your email address was updated and verified.');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not verify the code.');
    } finally {
      setEmailBusy(false);
    }
  };

  const resendEmailCode = async () => {
    if (!emailChallenge || resendIn) return;
    setEmailBusy(true);
    setEmailError('');
    try {
      const response = await api.resendCode(emailChallenge.challengeId);
      setEmailChallenge(response.data);
      setResendIn(response.data.resendAfter || 60);
      setEmailMessage('A new code was sent.');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not resend the code.');
    } finally {
      setEmailBusy(false);
    }
  };

  return <div className="space-y-5">
    <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-base font-bold text-slate-900">Personal information</h2><p className="text-xs text-slate-500 mt-1">Keep your details up to date for your orders and account.</p></div>
        {!editing && <button type="button" onClick={() => { setEditing(true); setProfileMessage(''); }} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-primary hover:bg-slate-50"><Pencil size={14} /> Edit profile</button>}
      </div>
      {profileMessage && <p role="status" className="text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 size={15} />{profileMessage}</p>}
      {editing ? <form onSubmit={saveProfile} className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-50 text-brand-primary font-black text-2xl flex items-center justify-center border border-indigo-100">
            {avatarUrl ? <img src={avatarUrl} alt="Profile preview" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="profile-photo" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Camera size={15} /> Upload photo</label>
            <input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} className="sr-only" />
            {avatarUrl && <button type="button" onClick={() => setAvatarUrl(null)} className="inline-flex items-center gap-1 px-2 py-2 text-xs text-rose-600"><Trash2 size={14} /> Remove</button>}
            <p className="w-full text-[11px] text-slate-500">Your photo is resized and saved with your account.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-xs font-semibold text-slate-700">Full name<input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none focus:border-brand-primary" /></label>
          <label className="block text-xs font-semibold text-slate-700">Mobile number <span className="font-normal text-slate-400">(optional)</span><div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-primary"><span className="px-3 py-3 text-sm text-slate-500 border-r border-slate-200">+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile number" className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-normal outline-none" /></div></label>
        </div>
        {profileError && <p role="alert" className="text-xs text-rose-600">{profileError}</p>}
        <div className="flex flex-wrap gap-2"><button disabled={saving} type="submit" className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button><button type="button" onClick={resetEdit} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600">Cancel</button></div>
      </form> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        <div className="sm:col-span-2 flex items-center gap-3"><div className="w-14 h-14 rounded-2xl overflow-hidden bg-indigo-50 text-brand-primary font-bold text-xl flex items-center justify-center">{user.avatarUrl ? <img src={user.avatarUrl} alt="Your profile" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}</div><span className="text-slate-500">Profile photo</span></div>
        <div><span className="text-slate-500 block mb-1">Full name</span><p className="font-bold text-slate-900 text-sm">{user.name}</p></div>
        <div><span className="text-slate-500 block mb-1">Mobile number</span><p className="font-bold text-slate-900 text-sm">{user.phone ? `+91 ${user.phone}` : 'Not provided'}</p></div>
      </div>}
    </section>

    <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Email address</h2><p className="text-xs text-slate-500 mt-1">Used for sign-in, order updates, and verification codes.</p></div>{!changingEmail && <button type="button" onClick={() => { setChangingEmail(true); setEmailMessage(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-primary hover:bg-slate-50">Change email</button>}</div>
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 break-all"><Mail size={16} className="text-slate-400 shrink-0" />{user.email}</p>
      {emailMessage && <p role="status" className="text-xs text-emerald-700">{emailMessage}</p>}
      {changingEmail && (emailChallenge ? <form onSubmit={verifyEmailChange} className="max-w-md space-y-3 pt-2"><p className="text-xs text-slate-600">Enter the code sent to <strong>{emailChallenge.email}</strong>. It expires in 10 minutes.</p><label className="block text-xs font-semibold text-slate-700">Verification code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm tracking-[.25em] outline-none focus:border-brand-primary" /></label><div className="flex flex-wrap items-center gap-3"><button disabled={emailBusy} type="submit" className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{emailBusy ? 'Verifying...' : 'Verify and change email'}</button><button type="button" disabled={emailBusy || resendIn > 0} onClick={resendEmailCode} className="text-xs font-semibold text-brand-primary disabled:text-slate-400">{resendIn ? `Resend in ${resendIn}s` : 'Resend code'}</button></div><button type="button" onClick={() => { setEmailChallenge(null); setEmailCode(''); setEmailMessage(''); }} className="text-xs text-slate-500 underline">Use a different email</button></form> : <form onSubmit={requestEmailChange} className="max-w-md space-y-3 pt-2"><label className="block text-xs font-semibold text-slate-700">New email address<input type="email" autoComplete="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none focus:border-brand-primary" /></label><p className="text-xs text-slate-500">We’ll send a code to the new address before changing it.</p><div className="flex gap-2"><button disabled={emailBusy} type="submit" className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{emailBusy ? 'Sending...' : 'Send verification code'}</button><button type="button" onClick={() => setChangingEmail(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-600">Cancel</button></div></form>)}
      {emailError && <p role="alert" className="text-xs text-rose-600">{emailError}</p>}
    </section>

    <section className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4"><div><h2 className="text-base font-bold text-slate-900">Account access</h2><p className="text-xs text-slate-500 mt-1">Your account role is managed by Pick2Buy.</p></div><div className="text-xs"><span className="text-slate-500 block mb-1">Account role</span><p className="font-bold text-brand-primary text-sm">{user.role}</p></div><div className="border-t border-slate-100 pt-4 space-y-3"><h3 className="text-sm font-bold text-slate-900">Google sign-in</h3>{user.googleLinked ? <p className="text-xs text-emerald-700">Google is connected to this account.</p> : import.meta.env.VITE_GOOGLE_CLIENT_ID ? <><p className="text-xs text-slate-500">Connect a Google account with the same email to sign in with Google next time.</p><GoogleSignIn text="continue_with" onCredential={async (credential) => { setGoogleMessage(''); try { await api.linkGoogle(credential); await refreshUser(); setGoogleMessage('Google account connected.'); } catch (error) { setGoogleMessage(error instanceof Error ? error.message : 'Could not connect Google.'); } }} /></> : <p className="text-xs text-slate-500">Google sign-in is not configured yet.</p>}{googleMessage && <p role="status" className="text-xs text-slate-700">{googleMessage}</p>}</div></section>
  </div>;
}
