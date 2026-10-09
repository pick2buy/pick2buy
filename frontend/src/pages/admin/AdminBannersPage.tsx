import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useModal } from '../../hooks/useModal';

type BannerForm = {
  title: string; subtitle: string; desktopImageUrl: string; mobileImageUrl: string;
  buttonText: string; linkUrl: string; displayOrder: number; isActive: boolean;
  startDate: string; endDate: string;
};
const emptyForm = (): BannerForm => ({ title: '', subtitle: '', desktopImageUrl: '', mobileImageUrl: '', buttonText: '', linkUrl: '/shop', displayOrder: 0, isActive: true, startDate: '', endDate: '' });
const localDate = (value?: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-indigo-100';

export const AdminBannersPage = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const canManage = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  const modalRef = useModal(open, () => setOpen(false));

  const load = async () => {
    setLoading(true);
    try { const response = await api.getAdminBanners(); setBanners(response.data || []); setError(''); }
    catch (err: any) { setError(err.message || 'Could not load banners'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const beginCreate = () => { setEditingId(null); setForm(emptyForm()); setError(''); setOpen(true); };
  const beginEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({ title: banner.title, subtitle: banner.subtitle || '', desktopImageUrl: banner.desktopImageUrl,
      mobileImageUrl: banner.mobileImageUrl || '', buttonText: banner.buttonText || '', linkUrl: banner.linkUrl,
      displayOrder: banner.displayOrder, isActive: banner.isActive, startDate: localDate(banner.startDate), endDate: localDate(banner.endDate) });
    setError(''); setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const payload = { title: form.title.trim(), subtitle: form.subtitle.trim() || null,
        desktopImageUrl: form.desktopImageUrl.trim(), mobileImageUrl: form.mobileImageUrl.trim() || null,
        buttonText: form.buttonText.trim() || null, linkUrl: form.linkUrl.trim(), displayOrder: Number(form.displayOrder),
        isActive: form.isActive, startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null };
      if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) throw new Error('End date must be after start date');
      if (editingId) await api.updateBanner(editingId, payload); else await api.createBanner(payload);
      setOpen(false); setNotice(`Banner ${editingId ? 'updated' : 'created'}.`); await load();
    } catch (err: any) { setError(err.message || 'Could not save banner'); }
    finally { setSaving(false); }
  };
  const remove = async (banner: any) => {
    if (!window.confirm(`Delete banner “${banner.title}”? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try { await api.deleteBanner(banner.id); setNotice('Banner deleted.'); await load(); }
    catch (err: any) { setError(err.message || 'Could not delete banner'); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black text-slate-900">Storefront Banners</h1><p className="mt-1 text-sm text-slate-500">Create promotions that appear on the home page while active.</p></div>{canManage && <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"><Plus size={17} /> Add Banner</button>}</div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {!loading && banners.map(banner => <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <img src={banner.desktopImageUrl} alt="" className="h-40 w-full bg-slate-100 object-cover" />
        <div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h2 className="font-bold text-slate-900">{banner.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{banner.isActive ? 'Active' : 'Inactive'}</span></div>
          <p className="line-clamp-2 text-sm text-slate-500">{banner.subtitle || banner.linkUrl}</p>
          <p className="text-xs text-slate-500">Order {banner.displayOrder}{banner.startDate ? ` · Starts ${new Date(banner.startDate).toLocaleDateString()}` : ''}{banner.endDate ? ` · Ends ${new Date(banner.endDate).toLocaleDateString()}` : ''}</p>
          {canManage && <div className="flex gap-2 pt-2"><button type="button" onClick={() => beginEdit(banner)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"><Edit3 size={14} /> Edit</button><button type="button" onClick={() => remove(banner)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button></div>}
        </div>
      </article>)}
      {!loading && !banners.length && <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 md:col-span-2">No banners yet. Add one to promote a collection or offer.</p>}
      {loading && <p className="text-sm text-slate-500">Loading banners…</p>}
    </div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close form" className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} /><div ref={modalRef} role="dialog" aria-modal="true" aria-label={`${editingId ? 'Edit' : 'Add'} banner`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit' : 'Add'} Banner</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <form onSubmit={save} className="space-y-4 text-sm font-semibold">
        <label className="block">Title *<input required minLength={2} maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} /></label>
        <label className="block">Subtitle<textarea rows={2} maxLength={300} value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className={inputClass} /></label>
        <label className="block">Desktop image URL *<input required type="url" value={form.desktopImageUrl} onChange={e => setForm({ ...form, desktopImageUrl: e.target.value })} className={inputClass} placeholder="https://…" /></label>
        <label className="block">Mobile image URL<input type="url" value={form.mobileImageUrl} onChange={e => setForm({ ...form, mobileImageUrl: e.target.value })} className={inputClass} placeholder="https://…" /></label>
        {form.desktopImageUrl && <img src={form.desktopImageUrl} alt="Banner preview" className="h-36 w-full rounded-xl bg-slate-100 object-cover" />}
        <div className="grid gap-4 sm:grid-cols-2"><label className="block">Button text<input value={form.buttonText} maxLength={80} onChange={e => setForm({ ...form, buttonText: e.target.value })} className={inputClass} placeholder="Shop now" /></label><label className="block">Destination path or HTTPS URL *<input required value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} className={inputClass} placeholder="/shop" /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block">Starts (optional)<input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></label><label className="block">Ends (optional)<input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></label></div>
        <div className="flex items-center gap-5"><label className="block">Display order<input type="number" min={0} step="1" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className={`${inputClass} w-28`} /></label><label className="mt-5 flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
        <div className="flex justify-end gap-2 pt-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Banner'}</button></div>
      </form>
    </div></div>}
  </div>;
};
