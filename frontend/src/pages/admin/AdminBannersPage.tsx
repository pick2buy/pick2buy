import React, { useEffect, useRef, useState } from 'react';
import { Edit3, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useModal } from '../../hooks/useModal';
import { confirmAction, toast } from '../../store/useToastStore';

type BannerPlacement = 'HERO' | 'CAMPAIGN' | 'ESSENTIALS';
type BannerForm = {
  placement: BannerPlacement;
  title: string; subtitle: string; desktopImageUrl: string; mobileImageUrl: string;
  buttonText: string; linkUrl: string; displayOrder: number; isActive: boolean;
  startDate: string; endDate: string;
};
const placements: { key: BannerPlacement; title: string; description: string; size: string }[] = [
  { key: 'HERO', title: 'Main hero banners', description: 'Large full-width promotion at the top of the storefront.', size: 'Recommended: 1600 × 325 desktop, 800 × 408 mobile. Desktop height follows the uploaded image proportions, without cropping or side gaps.' },
  { key: 'CAMPAIGN', title: 'Seasonal campaign banners', description: 'Square artwork carousel for seasonal products and collections.', size: 'Recommended: 1000 × 1000 desktop and mobile' },
  { key: 'ESSENTIALS', title: 'Everyday Essentials banners', description: 'Wide three-card promotional row shown below the campaign carousel.', size: 'Recommended: 1000 × 500 desktop, 800 × 500 mobile' },
];
const placementLabel = (placement?: string) => placements.find(item => item.key === placement)?.title || placements[2].title;
const emptyForm = (placement: BannerPlacement = 'ESSENTIALS'): BannerForm => ({ placement, title: '', subtitle: '', desktopImageUrl: '', mobileImageUrl: '', buttonText: '', linkUrl: '/shop', displayOrder: 0, isActive: true, startDate: '', endDate: '' });
const localDate = (value?: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-indigo-100';
const isUploadedImage = (value: string) => value.startsWith('data:image/');

const resizeBannerImage = async (file: File) => {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / image.width, 900 / image.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  let result = canvas.toDataURL('image/webp', 0.8);
  if (!result.startsWith('data:image/webp')) result = canvas.toDataURL('image/jpeg', 0.78);
  if (result.length > 550_000) result = canvas.toDataURL(result.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg', 0.66);
  if (result.length > 550_000) throw new Error('The image is still too large after compression. Choose a smaller image.');
  return result;
};

export const AdminBannersPage = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<'desktop' | 'mobile' | null>(null);
  const uploadBusy = useRef(false);
  const canManage = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));
  const modalRef = useModal(open, () => setOpen(false));

  const load = async () => {
    setLoading(true);
    try { const response = await api.getAdminBanners(); setBanners(response.data || []); setError(''); }
    catch (err: any) { setError(err.message || 'Could not load banners'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const beginCreate = (placement: BannerPlacement = 'ESSENTIALS') => { setEditingId(null); setForm(emptyForm(placement)); setError(''); setOpen(true); };
  const beginEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({ placement: banner.placement || 'ESSENTIALS', title: banner.title || '', subtitle: banner.subtitle || '', desktopImageUrl: banner.desktopImageUrl,
      mobileImageUrl: banner.mobileImageUrl || '', buttonText: banner.buttonText || '', linkUrl: banner.linkUrl,
      displayOrder: banner.displayOrder, isActive: banner.isActive, startDate: localDate(banner.startDate), endDate: localDate(banner.endDate) });
    setError(''); setOpen(true);
  };
  const uploadImage = async (target: 'desktop' | 'mobile', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await uploadImageFile(target, file);
  };
  const pasteImage = (target: 'desktop' | 'mobile', event: React.ClipboardEvent) => {
    const item = Array.from(event.clipboardData.items).find(item => item.kind === 'file' && item.type.startsWith('image/'));
    if (!item) return; // Keep normal URL/text paste behavior.
    event.preventDefault();
    const file = item.getAsFile();
    if (file) void uploadImageFile(target, file);
  };
  const uploadImageFile = async (target: 'desktop' | 'mobile', file: File) => {
    if (uploadBusy.current || saving) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Choose an image smaller than 8 MB.');
      return;
    }
    uploadBusy.current = true;
    setUploadingTarget(target); setError('');
    try {
      // Store the compressed banner in Supabase rather than keeping a Base64
      // string in the database response. The stored URL receives CDN caching.
      const preparedImage = await resizeBannerImage(file);
      const imageUrl = (await api.uploadProductImage(preparedImage)).data.url;
      setForm(current => target === 'desktop'
        ? { ...current, desktopImageUrl: imageUrl }
        : { ...current, mobileImageUrl: imageUrl });
    } catch (err: any) { setError(err.message || 'Could not prepare that image.'); }
    finally { uploadBusy.current = false; setUploadingTarget(null); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (uploadBusy.current) { setError('Please wait for the image upload to finish before saving.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { placement: form.placement, title: form.title.trim() || null, subtitle: form.subtitle.trim() || null,
        desktopImageUrl: form.desktopImageUrl.trim(), mobileImageUrl: form.mobileImageUrl.trim() || null,
        buttonText: form.buttonText.trim() || null, linkUrl: form.linkUrl.trim(), displayOrder: Number(form.displayOrder),
        isActive: form.isActive, startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null };
      if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) throw new Error('End date must be after start date');
      if (editingId) await api.updateBanner(editingId, payload); else await api.createBanner(payload);
      setOpen(false); toast.success(`Banner ${editingId ? 'updated' : 'created'}.`); await load();
    } catch (err: any) { setError(err.message || 'Could not save banner'); }
    finally { setSaving(false); }
  };
  const remove = async (banner: any) => {
    if (!await confirmAction('Delete banner?', `“${banner.title}” will be removed permanently.`, 'Delete banner', true)) return;
    setError('');
    try { await api.deleteBanner(banner.id); toast.success('Banner deleted.'); await load(); }
    catch (err: any) { setError(err.message || 'Could not delete banner'); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black text-slate-900">Storefront Banners</h1><p className="mt-1 text-sm text-slate-500">Manage the three promotional areas on the home page independently.</p></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading && <p className="text-sm text-slate-500">Loading banners…</p>}
    {!loading && placements.map(section => {
      const sectionBanners = banners.filter(banner => (banner.placement || 'ESSENTIALS') === section.key);
      return <section key={section.key} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby={`banner-section-${section.key}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id={`banner-section-${section.key}`} className="text-lg font-black text-slate-900">{section.title}</h2><p className="mt-1 text-sm text-slate-500">{section.description}</p><p className="mt-1 text-xs font-semibold text-brand-primary">{section.size}</p></div>{canManage && <button type="button" onClick={() => beginCreate(section.key)} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"><Plus size={17} /> Add to this section</button>}</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sectionBanners.map(banner => <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`bg-slate-100 ${section.key === 'CAMPAIGN' ? 'aspect-square' : section.key === 'HERO' ? 'aspect-[4.9/1]' : 'aspect-[2/1]'}`}><img src={banner.desktopImageUrl} alt="" className="h-full w-full object-cover" /></div>
            <div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold text-slate-900">{banner.title || 'Image banner'}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{banner.isActive ? 'Active' : 'Inactive'}</span></div>
              <p className="line-clamp-2 text-sm text-slate-500">{banner.subtitle || banner.linkUrl}</p>
              <p className="text-xs text-slate-500">Order {banner.displayOrder}{banner.startDate ? ` · Starts ${new Date(banner.startDate).toLocaleDateString()}` : ''}{banner.endDate ? ` · Ends ${new Date(banner.endDate).toLocaleDateString()}` : ''}</p>
              {canManage && <div className="flex gap-2 pt-2"><button type="button" onClick={() => beginEdit(banner)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"><Edit3 size={14} /> Edit</button><button type="button" onClick={() => remove(banner)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button></div>}
            </div>
          </article>)}
          {!sectionBanners.length && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No {section.title.toLowerCase()} yet. The current built-in artwork remains visible until you add one.</p>}
        </div>
      </section>;
    })}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close form" className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} /><div ref={modalRef} role="dialog" aria-modal="true" aria-label={`${editingId ? 'Edit' : 'Add'} banner`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit' : 'Add'} Banner</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <form onSubmit={save} className="space-y-4 text-sm font-semibold">
        <label className="block">Storefront section *<select required value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value as BannerPlacement })} className={inputClass}>{placements.map(item => <option key={item.key} value={item.key}>{item.title}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">{placements.find(item => item.key === form.placement)?.size}</span></label>
        <label className="block">Title (optional)<input maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Only needed when it is not already in the image" /></label>
        <label className="block">Subtitle<textarea rows={2} maxLength={300} value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className={inputClass} /></label>
        <div>
          <label className="block">Desktop image URL *<input type="text" inputMode="url" onPaste={event => pasteImage('desktop', event)} disabled={uploadingTarget !== null || saving} value={isUploadedImage(form.desktopImageUrl) ? '' : form.desktopImageUrl} onChange={e => setForm({ ...form, desktopImageUrl: e.target.value })} className={inputClass} placeholder="Paste an image with Ctrl+V, or enter https://…" /></label>
          <p className="mt-1 text-xs font-normal text-slate-500">Copy an image, click the field above, then press Ctrl+V (Mac: ⌘V). It uploads automatically.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><ImagePlus size={15} />{uploadingTarget === 'desktop' ? 'Preparing image…' : 'Upload desktop image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingTarget !== null} onChange={event => uploadImage('desktop', event)} /></label>{isUploadedImage(form.desktopImageUrl) && <><span className="text-xs font-medium text-emerald-700">Image uploaded</span><button type="button" onClick={() => setForm({ ...form, desktopImageUrl: '' })} className="text-xs font-bold text-slate-500 underline hover:text-slate-800">Remove</button></>}</div>
        </div>
        <div>
          <label className="block">Mobile image URL<input type="text" inputMode="url" onPaste={event => pasteImage('mobile', event)} disabled={uploadingTarget !== null || saving} value={isUploadedImage(form.mobileImageUrl) ? '' : form.mobileImageUrl} onChange={e => setForm({ ...form, mobileImageUrl: e.target.value })} className={inputClass} placeholder="Paste an image with Ctrl+V, or enter https://…" /></label>
          <p className="mt-1 text-xs font-normal text-slate-500">Paste a copied image here for mobile. PNG, JPEG and WebP up to 8 MB.</p>
          {form.mobileImageUrl && <img src={form.mobileImageUrl} alt="Mobile banner preview" className="mt-2 max-h-40 max-w-full rounded-lg object-contain" />}
          <div className="mt-2 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><ImagePlus size={15} />{uploadingTarget === 'mobile' ? 'Preparing image…' : 'Upload mobile image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingTarget !== null} onChange={event => uploadImage('mobile', event)} /></label>{isUploadedImage(form.mobileImageUrl) && <><span className="text-xs font-medium text-emerald-700">Image uploaded</span><button type="button" onClick={() => setForm({ ...form, mobileImageUrl: '' })} className="text-xs font-bold text-slate-500 underline hover:text-slate-800">Remove</button></>}</div>
        </div>
        {form.desktopImageUrl && <div><p className="mb-1 text-xs text-slate-500">{placementLabel(form.placement)} preview</p><div className={`w-full overflow-hidden rounded-xl bg-slate-100 ${form.placement === 'CAMPAIGN' ? 'mx-auto max-w-xs aspect-square' : form.placement === 'HERO' ? 'aspect-[4.9/1]' : 'aspect-[2/1]'}`}><img src={form.desktopImageUrl} alt="Banner preview" className="h-full w-full object-cover" /></div></div>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="block">Button text<input value={form.buttonText} maxLength={80} onChange={e => setForm({ ...form, buttonText: e.target.value })} className={inputClass} placeholder="Shop now" /></label><label className="block">Destination path or HTTPS URL *<input required value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} className={inputClass} placeholder="/shop" /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block">Starts (optional)<input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></label><label className="block">Ends (optional)<input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></label></div>
        <div className="flex items-center gap-5"><label className="block">Display order<input type="number" min={0} step="1" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className={`${inputClass} w-28`} /></label><label className="mt-5 flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
        <div className="flex justify-end gap-2 pt-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Banner'}</button></div>
      </form>
    </div></div>}
  </div>;
};
