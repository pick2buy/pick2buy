import { useEffect, useState } from 'react';
import { api } from '../../services/api';
export const AdminOffersPage = () => {
  const empty = { name: '', scope: 'PRODUCT', targetId: '', percentage: 10, startDate: '', endDate: '', isActive: true };
  const [form, setForm] = useState(empty), [offers, setOffers] = useState<any[]>([]), [products, setProducts] = useState<any[]>([]), [categories, setCategories] = useState<any[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const load = async () => {
    const [o, p, c] = await Promise.all([api.commerce('/admin/offers'), api.commerce('/admin/products'), api.commerce('/admin/categories')]);
    setOffers(o.data); setProducts(p.data); setCategories(c.data);
  };
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.commerce('/admin/offers', 'POST', { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() }); setForm(empty); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Product & category offers</h1><p>Discounts apply to the current selling price. Only the largest active product/category offer applies.</p>{error && <p role="alert" className="text-red-600">{error}</p>}<form onSubmit={save} className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2">
    <label>Offer name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="block w-full rounded border p-2" /></label>
    <label>Applies to<select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value, targetId: '' })} className="block w-full rounded border p-2"><option value="PRODUCT">Product</option><option value="CATEGORY">Category</option></select></label>
    <label>Product/category<select required value={form.targetId} onChange={e => setForm({ ...form, targetId: e.target.value })} className="block w-full rounded border p-2"><option value="">Choose</option>{(form.scope === 'PRODUCT' ? products : categories).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>Discount %<input type="number" min="1" max="100" required value={form.percentage} onChange={e => setForm({ ...form, percentage: Number(e.target.value) })} className="block w-full rounded border p-2" /></label>
    <label>Start<input type="datetime-local" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="block w-full rounded border p-2" /></label>
    <label>End<input type="datetime-local" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="block w-full rounded border p-2" /></label>
    <button disabled={busy} className="rounded-lg bg-orange-700 p-3 text-white">Create offer</button></form>
    {offers.map(o => <article key={o.id} className="flex flex-wrap justify-between gap-3 rounded-xl border bg-white p-4"><div><h2 className="font-bold">{o.name} · {o.percentage}%</h2><p>{(o.scope === 'PRODUCT' ? products : categories).find(t => t.id === o.targetId)?.name || o.targetId}</p><p className="text-xs">{new Date(o.startDate).toLocaleString()} – {new Date(o.endDate).toLocaleString()} · {o.isActive ? 'Enabled' : 'Disabled'}</p></div><button disabled={busy} onClick={async () => { setBusy(true); try { await api.commerce('/admin/offers/' + o.id, 'DELETE'); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } }} className="text-red-700">Delete</button></article>)}
    <div className="rounded-xl border bg-white p-4"><h2 className="font-bold">Referral reward</h2><p>After a referred customer verifies their email, the referrer receives a single-use 10% coupon (maximum INR 100, minimum order INR 499, valid 30 days). Referral codes and earned coupons appear in My Account.</p></div>
  </section>;
};
