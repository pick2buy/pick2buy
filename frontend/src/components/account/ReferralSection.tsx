import { useEffect, useState } from 'react';
import { api } from '../../services/api';
export const ReferralSection = () => {
  const [data, setData] = useState<any>(null), [error, setError] = useState('');
  useEffect(() => { api.commerce('/auth/me/referral').then(r => setData(r.data)).catch(e => setError(e.message)); }, []);
  return <details className="my-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-bold">Refer a friend & rewards</summary>{error && <p role="alert">{error}</p>}{data && <div className="mt-3 space-y-2 text-sm"><p>Your code: <strong>{data.referralCode}</strong></p><p>Share this link. When your friend registers and verifies their email, you receive a 10% coupon (up to INR 100 on INR 499+, valid 30 days).</p><input readOnly aria-label="Referral link" className="w-full rounded border p-2" value={window.location.origin + '/register?ref=' + data.referralCode} onFocus={e => e.target.select()} />{data.coupons.map((c: any) => <p key={c.code}><strong>{c.code}</strong> — {c.description}. Expires {new Date(c.endDate).toLocaleDateString()}.</p>)}</div>}</details>;
};
