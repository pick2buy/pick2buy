import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, Search, Check } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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
    setForm({ name: '', sku: '', categoryId: categories[0]?.id || '', brandId: '', price: 999, mrp: 1999, stock: 0, status: 'ACTIVE', description: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({ name: product.name, sku: product.sku, categoryId: product.categoryId, brandId: product.brandId || '',
      price: product.price, mrp: product.mrp, stock: product.stock, status: product.status,
      description: product.description, imageUrl: product.images?.[0]?.url || '' });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.updateProduct(editingId, {
        name: form.name, sku: form.sku, categoryId: form.categoryId, brandId: form.brandId || null,
        price: form.price, mrp: form.mrp, description: form.description, status: form.status, imageUrl: form.imageUrl,
      });
      else await api.createProduct({ ...form, brandId: form.brandId || undefined, images: form.imageUrl ? [{ url: form.imageUrl, isPrimary: true }] : [] });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleArchive = async (product: any) => {
    if (!window.confirm(`Archive ${product.name}? It will be hidden from the storefront.`)) return;
    try { await api.archiveProduct(product.id); loadData(); }
    catch (err: any) { alert(err.message || 'Could not archive product'); }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const modalRef = useModal(isModalOpen, () => setIsModalOpen(false));
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
                    {p.status !== 'ARCHIVED' && <button onClick={() => handleArchive(p)} aria-label={`Archive ${p.name}`} className="rounded-lg border border-slate-200 p-2 text-rose-600"><Trash2 size={15} /></button>}
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

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. UltraFit Sports Smartwatch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-primary"
                />
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono outline-none focus:border-brand-primary"
                  />
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    disabled={Boolean(editingId)}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
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
                  <label className="font-bold text-slate-700 block mb-1">Image URL (optional)</label>
                  <input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Comprehensive description of product specifications and warranty..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
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
    </div>
  );
};
