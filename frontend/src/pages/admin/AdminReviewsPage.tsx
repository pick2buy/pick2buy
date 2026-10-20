import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useModal } from '../../hooks/useModal';
import { confirmAction, toast } from '../../store/useToastStore';

type ReviewForm = {
  productId: string; userId: string; customerName: string; rating: number; title: string; comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; isVerifiedPurchase: boolean; adminReply: string;
};

const blankForm = (): ReviewForm => ({ productId: '', userId: '', customerName: '', rating: 5, title: '', comment: '', status: 'APPROVED', isVerifiedPurchase: false, adminReply: '' });
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-indigo-100';
const statuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const canManage = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  const modalRef = useModal(open, () => setOpen(false));

  const load = async () => {
    setLoading(true);
    try {
      const [reviewResponse, productResponse, customerResponse] = await Promise.all([
        api.getAdminReviews({ q: query, status }), api.getAdminProducts(), api.getAdminCustomers(),
      ]);
      setReviews(reviewResponse.data || []);
      setProducts(productResponse.data || []);
      setCustomers(customerResponse.data || []);
      setError('');
    } catch (err: any) { setError(err.message || 'Could not load reviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);
  const productOptions = useMemo(() => products.map(product => ({ id: product.id, label: `${product.name} (${product.sku})` })), [products]);

  const beginCreate = () => {
    setEditingId(null);
    setForm({ ...blankForm(), productId: products[0]?.id || '' });
    setError(''); setOpen(true);
  };
  const beginEdit = (review: any) => {
    setEditingId(review.id);
    setForm({ productId: review.productId, userId: review.userId, customerName: `${review.user?.name || ''} — ${review.user?.email || ''}`, rating: review.rating, title: review.title || '', comment: review.comment,
      status: review.status, isVerifiedPurchase: review.isVerifiedPurchase, adminReply: review.adminReply || '' });
    setError(''); setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const common = { rating: Number(form.rating), title: form.title.trim() || null, comment: form.comment.trim(), status: form.status,
        isVerifiedPurchase: form.isVerifiedPurchase, adminReply: form.adminReply.trim() || null };
      if (editingId) await api.updateAdminReview(editingId, common);
      else {
        const matchedCustomer = customers.find(customer => `${customer.name} — ${customer.email}` === form.customerName.trim())
          || customers.find(customer => customer.name.toLowerCase() === form.customerName.trim().toLowerCase());
        if (!matchedCustomer) throw new Error('Choose an existing customer from the suggestions.');
        await api.createAdminReview({ ...common, productId: form.productId, userId: matchedCustomer.id });
      }
      setOpen(false); toast.success(`Review ${editingId ? 'updated' : 'created'}.`); await load();
    } catch (err: any) { setError(err.message || 'Could not save review'); }
    finally { setSaving(false); }
  };
  const remove = async (review: any) => {
    if (!await confirmAction('Delete review?', `The review by ${review.user?.name || 'this customer'} will be removed permanently.`, 'Delete review', true)) return;
    try { await api.deleteAdminReview(review.id); toast.success('Review deleted.'); await load(); }
    catch (err: any) { setError(err.message || 'Could not delete review'); }
  };
  const search = (event: React.FormEvent) => { event.preventDefault(); load(); };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black text-slate-900">Reviews & Ratings</h1><p className="mt-1 text-sm text-slate-500">Moderate product feedback and manage the ratings shown on the storefront.</p></div>{canManage && <button type="button" onClick={beginCreate} disabled={!products.length || !customers.length} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"><Plus size={17} /> Add Review</button>}</div>
    <form onSubmit={search} className="flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search product or customer" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-primary" /></div><select value={status} onChange={event => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select><button type="submit" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50">Search</button></form>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
      {!loading && reviews.map(review => <tr key={review.id}><td className="px-4 py-3 font-semibold text-slate-900">{review.product?.name}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{review.user?.name}</p><p className="text-xs text-slate-500">{review.user?.email}</p></td><td className="px-4 py-3"><span className="inline-flex items-center gap-1 font-bold text-amber-600">{review.rating} <Star size={14} className="fill-amber-400 stroke-amber-400" /></span></td><td className="max-w-xs px-4 py-3"><p className="truncate font-medium text-slate-800">{review.title || 'Untitled review'}</p><p className="line-clamp-1 text-xs text-slate-500">{review.comment}</p></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${review.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : review.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{review.status}</span></td><td className="px-4 py-3 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 text-right">{canManage && <div className="inline-flex gap-1"><button type="button" onClick={() => beginEdit(review)} aria-label="Edit review" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary"><Edit3 size={17} /></button><button type="button" onClick={() => remove(review)} aria-label="Delete review" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={17} /></button></div>}</td></tr>)}
      {!loading && !reviews.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No reviews match the current filters.</td></tr>}{loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading reviews…</td></tr>}
    </tbody></table></div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close form" className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} /><div ref={modalRef} role="dialog" aria-modal="true" aria-label={`${editingId ? 'Edit' : 'Add'} review`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit' : 'Add'} Review</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Product *<select required disabled={!!editingId} value={form.productId} onChange={event => setForm({ ...form, productId: event.target.value })} className={inputClass}>{productOptions.map(product => <option key={product.id} value={product.id}>{product.label}</option>)}</select></label><label className="block text-sm font-semibold">Customer name *<input required list="review-customers" disabled={!!editingId} value={form.customerName} onChange={event => setForm({ ...form, customerName: event.target.value })} placeholder="Type a customer name" className={inputClass} /><datalist id="review-customers">{customers.map(customer => <option key={customer.id} value={`${customer.name} — ${customer.email}`} />)}</datalist></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Rating *<select value={form.rating} onChange={event => setForm({ ...form, rating: Number(event.target.value) })} className={inputClass}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}</select></label><label className="block text-sm font-semibold">Status *<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as ReviewForm['status'] })} className={inputClass}>{statuses.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div><label className="block text-sm font-semibold">Title<input maxLength={160} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className={inputClass} /></label><label className="block text-sm font-semibold">Review *<textarea required minLength={1} maxLength={5000} rows={4} value={form.comment} onChange={event => setForm({ ...form, comment: event.target.value })} className={inputClass} /></label><label className="block text-sm font-semibold">Admin reply<textarea maxLength={2000} rows={3} value={form.adminReply} onChange={event => setForm({ ...form, adminReply: event.target.value })} className={inputClass} /></label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isVerifiedPurchase} onChange={event => setForm({ ...form, isVerifiedPurchase: event.target.checked })} /> Verified purchase</label><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Review'}</button></div></form></div></div>}
  </div>;
};
