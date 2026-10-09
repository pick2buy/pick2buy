import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useModal } from '../../hooks/useModal';

type Tab = 'categories' | 'subcategories' | 'brands';
type CatalogForm = {
  name: string; slug: string; description: string; imageUrl: string; bannerUrl: string;
  parentId: string; featured: boolean; displayOrder: number; logoUrl: string;
};
const emptyForm = (): CatalogForm => ({ name: '', slug: '', description: '', imageUrl: '', bannerUrl: '', parentId: '', featured: false, displayOrder: 0, logoUrl: '' });
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-indigo-100';

export const AdminCatalogPage = () => {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const canManage = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  const modalRef = useModal(open, () => setOpen(false));

  const load = async () => {
    setLoading(true);
    try {
      const [catResponse, brandResponse] = await Promise.all([api.getAdminCategories(), api.getAdminBrands()]);
      setCategories(catResponse.data || []);
      setBrands(brandResponse.data || []);
      setError('');
    } catch (err: any) { setError(err.message || 'Could not load catalog'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const beginCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), parentId: tab === 'subcategories' ? categories.find(c => !c.parentId)?.id || '' : '' });
    setError('');
    setOpen(true);
  };
  const beginEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name, slug: item.slug, description: item.description || '', imageUrl: item.imageUrl || '',
      bannerUrl: item.bannerUrl || '', parentId: item.parentId || '', featured: item.featured || false,
      displayOrder: item.displayOrder || 0, logoUrl: item.logoUrl || '',
    });
    setError('');
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      if (tab === 'brands') {
        const payload = { name: form.name.trim(), ...(form.slug.trim() ? { slug: form.slug.trim() } : {}), logoUrl: form.logoUrl.trim() || null };
        if (editingId) await api.updateBrand(editingId, payload); else await api.createBrand(payload);
      } else {
        const payload = {
          name: form.name.trim(), ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
          description: form.description.trim(), imageUrl: form.imageUrl.trim() || null,
          bannerUrl: form.bannerUrl.trim() || null, parentId: tab === 'subcategories' ? form.parentId : null,
          featured: form.featured, displayOrder: Number(form.displayOrder),
        };
        if (tab === 'subcategories' && !payload.parentId) throw new Error('Choose a parent category');
        if (editingId) await api.updateCategory(editingId, payload); else await api.createCategory(payload);
      }
      setOpen(false);
      setNotice(`${tab === 'brands' ? 'Brand' : tab === 'subcategories' ? 'Subcategory' : 'Category'} ${editingId ? 'updated' : 'created'}.`);
      await load();
    } catch (err: any) { setError(err.message || 'Could not save item'); }
    finally { setSaving(false); }
  };

  const remove = async (item: any) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try {
      if (tab === 'brands') await api.deleteBrand(item.id); else await api.deleteCategory(item.id);
      setNotice(`${item.name} deleted.`);
      await load();
    } catch (err: any) { setError(err.message || 'Could not delete item'); }
  };

  const rows = tab === 'brands' ? brands : categories.filter(category => tab === 'subcategories' ? !!category.parentId : !category.parentId);
  const noun = tab === 'brands' ? 'Brand' : tab === 'subcategories' ? 'Subcategory' : 'Category';

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-black text-slate-900">Categories & Brands</h1><p className="mt-1 text-sm text-slate-500">Organize the storefront catalog and product filters.</p></div>
      {canManage && <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"><Plus size={17} /> Add {noun}</button>}
    </div>
    <div className="flex flex-wrap gap-2 border-b border-slate-200" role="tablist" aria-label="Catalog management">
      {(['categories', 'subcategories', 'brands'] as const).map(value => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setError(''); setNotice(''); }} className={`px-4 py-3 text-sm font-bold capitalize ${tab === value ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-slate-500 hover:text-slate-900'}`}>{value}</button>)}
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">{tab === 'subcategories' ? 'Parent' : 'Products'}</th><th className="px-4 py-3">{tab === 'brands' ? 'Logo' : 'Order'}</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {!loading && rows.map(item => <tr key={item.id}>
            <td className="px-4 py-3 font-semibold text-slate-900">{item.name}{tab === 'categories' && item._count?.children > 0 && <span className="ml-2 text-xs font-normal text-slate-500">{item._count.children} subcategories</span>}</td>
            <td className="px-4 py-3 text-slate-500">{item.slug}</td>
            <td className="px-4 py-3 text-slate-500">{tab === 'subcategories' ? item.parent?.name : item._count?.products || 0}</td>
            <td className="px-4 py-3 text-slate-500">{tab === 'brands' ? item.logoUrl ? <img src={item.logoUrl} alt="" className="h-8 w-12 object-contain" /> : '—' : item.displayOrder}</td>
            <td className="px-4 py-3 text-right">{canManage && <div className="inline-flex gap-1"><button type="button" onClick={() => beginEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-primary"><Edit3 size={17} /></button><button type="button" onClick={() => remove(item)} aria-label={`Delete ${item.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={17} /></button></div>}</td>
          </tr>)}
          {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No {tab} yet.</td></tr>}
          {loading && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Loading catalog…</td></tr>}
        </tbody>
      </table>
    </div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close form" className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} /><div ref={modalRef} role="dialog" aria-modal="true" aria-label={`${editingId ? 'Edit' : 'Add'} ${noun}`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit' : 'Add'} {noun}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm font-semibold">Name *<input required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`${inputClass} mt-1`} /></label>
        <label className="block text-sm font-semibold">Slug <span className="font-normal text-slate-500">(generated from name if blank)</span><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={`${inputClass} mt-1`} /></label>
        {tab === 'brands' ? <label className="block text-sm font-semibold">Logo image URL<input type="url" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className={`${inputClass} mt-1`} placeholder="https://…" /></label> : <>
          {tab === 'subcategories' && <label className="block text-sm font-semibold">Parent category *<select required value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className={`${inputClass} mt-1`}>{categories.filter(category => !category.parentId).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
          <label className="block text-sm font-semibold">Description<textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} mt-1`} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Image URL<input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className={`${inputClass} mt-1`} placeholder="https://…" /></label><label className="block text-sm font-semibold">Banner URL<input type="url" value={form.bannerUrl} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} className={`${inputClass} mt-1`} placeholder="https://…" /></label></div>
          <div className="flex items-center gap-5"><label className="text-sm font-semibold">Display order<input type="number" step="1" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className={`${inputClass} mt-1 w-28`} /></label><label className="mt-5 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label></div>
        </>}
        <div className="flex justify-end gap-2 pt-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : `Save ${noun}`}</button></div>
      </form>
    </div></div>}
  </div>;
};
