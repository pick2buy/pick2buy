import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, Search, ImagePlus, X, Archive, AlertTriangle } from 'lucide-react';
import { toast } from '../../store/useToastStore';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

type ProductVariantForm = { name: string; sku: string; size: string; color: string; price: number; mrp: number; stock: number };
const isProductImageUrl = (value: string) => /^data:image\/(png|jpeg|webp);base64,/i.test(value) || (() => {
  try { new URL(value); return true; } catch { return false; }
})();

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'archive' | 'delete'; product: any } | null>(null);
  const canManage = ['ADMIN', 'MANAGER'].includes(useAuthStore(s => s.user?.role || ''));

  // New product form
  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    price: 999,
    mrp: 1999,
    stock: 50,
    status: 'ACTIVE',
    description: '',
    imageUrl: '',
    imageUrls: [] as string[],
    sourcePlatform: 'OWN',
    sourceProductCode: '',
    sourceUrl: '',
    variants: [] as ProductVariantForm[],
  });

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      api.getAdminProducts(),
      api.getCategories(),
      api.getAdminBrands(),
    ]).then(([prodRes, catRes, brandRes]) => {
      setError('');
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      if (catRes.data?.length) {
        setForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    }).catch(err => setError(err.message || 'Could not load products'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormErrors({});
    setImageUrlInput('');
    setForm({ name: '', sku: '', categoryId: categories[0]?.id || '', brandId: '', price: 999, mrp: 1999, stock: 0, status: 'ACTIVE', description: '', imageUrl: '', imageUrls: [], sourcePlatform: 'OWN', sourceProductCode: '', sourceUrl: '', variants: [] });
    setIsModalOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setFormErrors({});
    setForm({ name: product.name, sku: product.sku, categoryId: product.categoryId, brandId: product.brandId || '',
      price: product.price, mrp: product.mrp, stock: product.stock, status: product.status,
      description: product.description, imageUrl: product.images?.[0]?.url || '', imageUrls: product.images?.map((image: any) => image.url) || [],
      sourcePlatform: product.sourcePlatform || 'OWN', sourceProductCode: product.sourceProductCode || '', sourceUrl: product.sourceUrl || '',
      variants: (product.variants || []).map((variant: any) => ({ name: variant.name, sku: variant.sku, size: variant.size || '', color: variant.color || '', price: variant.price, mrp: variant.mrp, stock: variant.stock })) });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 3) errors.name = 'Enter a product title with at least 3 characters.';
    if (form.sku.trim().length < 2) errors.sku = 'Enter an SKU with at least 2 characters.';
    if (!form.categoryId) errors.categoryId = 'Select a category.';
    if (!Number.isFinite(form.price) || form.price < 0) errors.price = 'Enter a valid selling price.';
    if (!Number.isFinite(form.mrp) || form.mrp < 0) errors.mrp = 'Enter a valid MRP.';
    else if (form.mrp < form.price) errors.mrp = 'MRP cannot be lower than the selling price.';
    if (!Number.isInteger(form.stock) || form.stock < 0) errors.stock = 'Enter a whole number of units.';
    if (form.description.trim().length < 10) errors.description = 'Enter a description with at least 10 characters.';
    if (!form.imageUrls.length) errors.images = 'Upload a primary product image or add an image URL.';
    if (form.imageUrl && !isProductImageUrl(form.imageUrl)) errors.imageUrl = 'Enter a valid image URL.';
    const imageUrls = Array.from(new Set([form.imageUrl, ...form.imageUrls].filter(Boolean)));
    for (const imageUrl of imageUrls) {
      if (!isProductImageUrl(imageUrl)) { errors.imageUrl = 'One of the product images is invalid.'; break; }
    }
    form.variants.forEach((variant, index) => {
      if (variant.name.trim().length < 1) errors[`variant-${index}`] = 'Each variant needs a name.';
      if (variant.sku.trim().length < 2) errors[`variant-${index}`] = 'Each variant needs an SKU of at least 2 characters.';
      if (!Number.isFinite(variant.price) || variant.price < 0) errors[`variant-${index}`] = 'Variant price must be valid.';
      if (!Number.isFinite(variant.mrp) || variant.mrp < variant.price) errors[`variant-${index}`] = 'Variant MRP cannot be lower than its price.';
      if (!Number.isInteger(variant.stock) || variant.stock < 0) errors[`variant-${index}`] = 'Variant stock must be a whole number.';
    });
    if (form.sourcePlatform === 'MEESHO') {
      if (!form.sourceProductCode.trim() && !form.sourceUrl.trim()) errors.sourceProductCode = 'Add the Meesho product code or listing URL.';
      if (form.sourceUrl) {
        try {
          const hostname = new URL(form.sourceUrl).hostname.toLowerCase();
          if (hostname !== 'meesho.com' && !hostname.endsWith('.meesho.com')) errors.sourceUrl = 'Use a valid meesho.com listing URL.';
        } catch { errors.sourceUrl = 'Enter a valid Meesho listing URL.'; }
      }
    }
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    try {
      const sourceDetails = form.sourcePlatform === 'MEESHO'
        ? { sourcePlatform: 'MEESHO', ...(form.sourceProductCode ? { sourceProductCode: form.sourceProductCode } : {}), ...(form.sourceUrl ? { sourceUrl: form.sourceUrl } : {}) }
        : { sourcePlatform: 'OWN', sourceProductCode: undefined, sourceUrl: undefined };
      if (editingId) await api.updateProduct(editingId, {
        name: form.name, sku: form.sku, categoryId: form.categoryId, brandId: form.brandId || null,
        price: form.price, mrp: form.mrp, stock: form.stock, description: form.description, status: form.status,
        images: imageUrls.map((url, index) => ({ url, isPrimary: index === 0 })), variants: form.variants, ...sourceDetails,
        sourceProductCode: form.sourcePlatform === 'MEESHO' ? form.sourceProductCode || null : null,
        sourceUrl: form.sourcePlatform === 'MEESHO' ? form.sourceUrl || null : null,
      });
      else await api.createProduct({
        ...form,
        ...sourceDetails,
        brandId: form.brandId || undefined,
        images: imageUrls.map((url, index) => ({ url, isPrimary: index === 0 })),
        variants: form.variants,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const apiErrors: Record<string, string> = {};
      for (const item of err.errors || []) {
        const [field, ...message] = String(item).split(':');
        if (field && message.length) apiErrors[field] = message.join(':').trim();
      }
      if (/MRP cannot/i.test(err.message)) apiErrors.mrp = err.message;
      setFormErrors(Object.keys(apiErrors).length ? apiErrors : { general: err.message || 'Could not save this product. Please try again.' });
    }
  };

  const handleArchive = (product: any) => setPendingAction({ type: 'archive', product });

  const handleDelete = (product: any) => setPendingAction({ type: 'delete', product });

  const confirmProductAction = async () => {
    if (!pendingAction) return;
    const { type, product } = pendingAction;
    try {
      if (type === 'archive') await api.archiveProduct(product.id);
      else await api.deleteProduct(product.id);
      setPendingAction(null);
      toast.success(type === 'archive' ? 'Product archived. It is now hidden from the storefront.' : 'Product deleted permanently.');
      loadData();
    } catch (err: any) {
      setPendingAction(null);
      toast.error(err.message || `Could not ${type} product.`);
    }
  };

  const resizeImage = async (file: File) => {
    const image = await createImageBitmap(file);
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    let result = canvas.toDataURL('image/jpeg', 0.82);
    if (result.length > 380_000) result = canvas.toDataURL('image/jpeg', 0.64);
    if (result.length > 380_000) throw new Error(`${file.name} is too large after compression. Choose a smaller photo.`);
    return result;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8_000_000)) {
      setFormErrors(current => ({ ...current, images: 'Choose PNG, JPEG, or WebP images under 8 MB each.' }));
      return;
    }
    setIsProcessingImages(true);
    try {
      const uploaded = await Promise.all(files.slice(0, 6).map(resizeImage));
      setForm(current => {
        const imageUrls = [...current.imageUrls, ...uploaded].slice(0, 6);
        return { ...current, imageUrls, imageUrl: imageUrls[0] || '' };
      });
      setFormErrors(current => ({ ...current, images: '' }));
    } catch (error) {
      setFormErrors(current => ({ ...current, images: error instanceof Error ? error.message : 'Could not process these images.' }));
    } finally { setIsProcessingImages(false); }
  };

  const setPrimaryImage = (index: number) => setForm(current => {
    const imageUrls = [...current.imageUrls];
    const [primary] = imageUrls.splice(index, 1);
    imageUrls.unshift(primary);
    return { ...current, imageUrls, imageUrl: imageUrls[0] || '' };
  });

  const removeImage = (index: number) => setForm(current => {
    const imageUrls = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
    return { ...current, imageUrls, imageUrl: imageUrls[0] || '' };
  });

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!isProductImageUrl(url)) {
      setFormErrors(current => ({ ...current, imageUrl: 'Enter a valid image URL.' }));
      return;
    }
    setForm(current => {
      if (current.imageUrls.includes(url)) return current;
      const imageUrls = [...current.imageUrls, url].slice(0, 6);
      return { ...current, imageUrls, imageUrl: imageUrls[0] || '' };
    });
    setImageUrlInput('');
    setFormErrors(current => ({ ...current, imageUrl: '', images: '' }));
  };

  const addVariant = () => setForm(current => {
    const position = current.variants.length + 1;
    return { ...current, variants: [...current.variants, { name: `Variant ${position}`, sku: `${current.sku || 'PRODUCT'}-V${position}`, size: '', color: '', price: current.price, mrp: current.mrp, stock: 0 }] };
  });

  const updateVariant = (index: number, field: keyof ProductVariantForm, value: string | number) => setForm(current => ({
    ...current,
    variants: current.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: value } : variant),
  }));

  const removeVariant = (index: number) => setForm(current => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const modalRef = useModal(isModalOpen, () => setIsModalOpen(false));
  const actionModalRef = useModal(Boolean(pendingAction), () => setPendingAction(null));
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage catalog details, pricing and visibility across categories</p>
        </div>

        {canManage && <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-brand-primary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Products Table */}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price / MRP</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                {canManage && <th className="py-3.5 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || '/product-placeholder.svg'}
                        alt={p.name}
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/product-placeholder.svg'; }}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                      />
                      <span className="font-bold text-slate-800 line-clamp-1 max-w-xs">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                  <td className="py-3 px-4"><span className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${p.sourcePlatform === 'MEESHO' ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-slate-100 text-slate-600'}`}>{p.sourcePlatform === 'MEESHO' ? 'Meesho' : 'Own'}</span></td>
                  <td className="py-3 px-4 text-slate-600">{p.category?.name || 'Uncategorized'}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{formatINR(p.price)}</span>
                    <span className="text-[10px] text-slate-400 line-through">{formatINR(p.mrp)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                      {p.status}
                    </span>
                  </td>
                  {canManage && <td className="py-3 px-4"><div className="flex gap-2">
                    <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="rounded-lg border border-slate-200 p-2 text-brand-primary"><Edit3 size={15} /></button>
                    {p.status !== 'ARCHIVED' && <button onClick={() => handleArchive(p)} aria-label={`Archive ${p.name}`} title="Archive product" className="rounded-lg border border-slate-200 px-2 text-slate-600">Archive</button>}
                    <button onClick={() => handleDelete(p)} aria-label={`Delete ${p.name}`} title="Delete permanently" className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                  </div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Products form" className="max-h-[calc(100dvh-2rem)] overflow-y-auto relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-4">
            <h3 className="text-lg font-black text-slate-900">{editingId ? 'Edit Product' : 'Add New Product'}</h3>

            <form noValidate onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              {formErrors.general && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">{formErrors.general}</p>}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. UltraFit Sports Smartwatch"
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-brand-primary ${formErrors.name ? 'border-rose-500' : 'border-slate-200'}`}
                />
                {formErrors.name && <p className="mt-1 text-rose-600">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="EL-WAT-099"
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 font-mono outline-none focus:border-brand-primary ${formErrors.sku ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                  {formErrors.sku && <p className="mt-1 text-rose-600">{formErrors.sku}</p>}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  >
                    {categories.map((c) => <React.Fragment key={c.id}><option value={c.id}>{c.name}</option>{c.children?.map((child: any) => <option key={child.id} value={child.id}>↳ {child.name}</option>)}</React.Fragment>)}
                  </select>
                  {formErrors.categoryId && <p className="mt-1 text-rose-600">{formErrors.categoryId}</p>}
                </div>
              </div>

              <div><label className="font-bold text-slate-700 block mb-1">Brand (optional)</label><select value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"><option value="">No brand</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none ${formErrors.price ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                  {formErrors.price && <p className="mt-1 text-rose-600">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none ${formErrors.mrp ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                  {formErrors.mrp && <p className="mt-1 text-rose-600">{formErrors.mrp}</p>}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none ${formErrors.stock ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                  {formErrors.stock && <p className="mt-1 text-rose-600">{formErrors.stock}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="OUT_OF_STOCK">Out of stock</option><option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product images</label>
                  <label className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-brand-primary hover:bg-indigo-50">
                    <ImagePlus size={16} /> {isProcessingImages ? 'Preparing images…' : 'Upload images'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={isProcessingImages} onChange={handleImageUpload} className="sr-only" />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL <span className="font-normal text-slate-400">(optional)</span></label>
                <div className="flex gap-2">
                  <input type="url" value={imageUrlInput} onChange={event => setImageUrlInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }} placeholder="https://example.com/product-photo.jpg" className={`min-w-0 flex-1 bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-brand-primary ${formErrors.imageUrl ? 'border-rose-500' : 'border-slate-200'}`} />
                  <button type="button" onClick={addImageUrl} className="shrink-0 rounded-xl border border-brand-primary px-3 font-bold text-brand-primary hover:bg-indigo-50">Add URL</button>
                </div>
                {formErrors.imageUrl && <p className="mt-1 text-rose-600">{formErrors.imageUrl}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between"><div><p className="font-bold text-slate-700">Product photos</p><p className="text-[10px] text-slate-500">First photo is primary. Add up to 6 PNG, JPEG, or WebP images.</p></div><span className="text-[10px] font-bold text-slate-500">{form.imageUrls.length}/6</span></div>
                {form.imageUrls.length ? <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product photos">{form.imageUrls.map((url, index) => <div key={`${url}-${index}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><img src={url} alt={`Product photo ${index + 1}`} className="h-full w-full object-cover" /><span className="absolute left-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold text-white">{index === 0 ? 'Primary' : index + 1}</span>{index > 0 && <button type="button" onClick={() => setPrimaryImage(index)} className="absolute bottom-1 left-1 rounded bg-white px-1.5 py-1 text-[9px] font-bold text-slate-700 shadow">Make primary</button>}<button type="button" onClick={() => removeImage(index)} aria-label={`Remove product photo ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-white p-1 text-rose-600 shadow"><X size={11} /></button></div>)}</div> : <p className="py-2 text-[11px] text-slate-500">Upload a primary image to create this product.</p>}
                {formErrors.images && <p className="mt-2 text-rose-600">{formErrors.images}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold text-slate-700">Variants <span className="font-normal text-slate-400">(optional)</span></p><p className="mt-0.5 text-[10px] text-slate-500">Add versions such as a color or size. Each variant can have its own SKU, price, and stock.</p></div>
                  <button type="button" onClick={addVariant} className="shrink-0 rounded-xl border border-brand-primary px-3 py-2 text-[11px] font-bold text-brand-primary hover:bg-indigo-50">+ Add variant</button>
                </div>
                {form.variants.length > 0 && <div className="mt-3 space-y-3">
                  {form.variants.map((variant, index) => <div key={`${variant.sku}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between"><p className="font-bold text-slate-600">Variant {index + 1}</p><button type="button" onClick={() => removeVariant(index)} className="rounded-lg p-1 text-rose-600 hover:bg-rose-50" aria-label={`Remove variant ${index + 1}`}><Trash2 size={14} /></button></div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input value={variant.name} onChange={event => updateVariant(index, 'name', event.target.value)} placeholder="Variant name, e.g. Navy / L" aria-label={`Variant ${index + 1} name`} className="bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                      <input value={variant.sku} onChange={event => updateVariant(index, 'sku', event.target.value.toUpperCase())} placeholder="Variant SKU" aria-label={`Variant ${index + 1} SKU`} className="bg-white border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-brand-primary" />
                      <input value={variant.color} onChange={event => updateVariant(index, 'color', event.target.value)} placeholder="Color (optional)" aria-label={`Variant ${index + 1} color`} className="bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                      <input value={variant.size} onChange={event => updateVariant(index, 'size', event.target.value)} placeholder="Size (optional)" aria-label={`Variant ${index + 1} size`} className="bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input type="number" value={variant.price} onChange={event => updateVariant(index, 'price', Number(event.target.value))} placeholder="Price" aria-label={`Variant ${index + 1} price`} className="min-w-0 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                      <input type="number" value={variant.mrp} onChange={event => updateVariant(index, 'mrp', Number(event.target.value))} placeholder="MRP" aria-label={`Variant ${index + 1} MRP`} className="min-w-0 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                      <input type="number" value={variant.stock} onChange={event => updateVariant(index, 'stock', Number(event.target.value))} placeholder="Stock" aria-label={`Variant ${index + 1} stock`} className="min-w-0 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-brand-primary" />
                    </div>
                    {formErrors[`variant-${index}`] && <p className="mt-2 text-rose-600">{formErrors[`variant-${index}`]}</p>}
                  </div>)}
                </div>}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Comprehensive description of product specifications and warranty..."
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 outline-none ${formErrors.description ? 'border-rose-500' : 'border-slate-200'}`}
                />
                {formErrors.description && <p className="mt-1 text-rose-600">{formErrors.description}</p>}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-brand-hover"
                >
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" aria-label="Close confirmation" className="fixed inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm" onClick={() => setPendingAction(null)} />
          <div ref={actionModalRef} role="alertdialog" aria-modal="true" aria-labelledby="product-action-title" className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${pendingAction.type === 'delete' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{pendingAction.type === 'delete' ? <AlertTriangle size={23} /> : <Archive size={23} />}</div>
            <h3 id="product-action-title" className="text-lg font-black text-slate-900">{pendingAction.type === 'delete' ? 'Delete product?' : 'Archive product?'}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600"><strong className="font-bold text-slate-800">{pendingAction.product.name}</strong>{pendingAction.type === 'delete' ? ' will be permanently removed. This cannot be undone.' : ' will be hidden from the storefront. You can still find it in the product list.'}</p>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingAction(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={confirmProductAction} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white ${pendingAction.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{pendingAction.type === 'delete' ? 'Delete permanently' : 'Archive product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
