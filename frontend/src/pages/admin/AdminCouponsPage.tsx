import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, Check } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: 15,
    minOrderValue: 999,
    maxDiscount: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    isActive: true,
  });

  const loadCoupons = () => {
    setIsLoading(true);
    api.getAdminCoupons()
      .then((res) => setCoupons(res.data || []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCoupon({
        ...form,
        code: form.code.toUpperCase(),
      });
      setIsModalOpen(false);
      setForm({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: 15,
        minOrderValue: 999,
        maxDiscount: 500,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        isActive: true,
      });
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.deleteCoupon(id);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const modalRef = useModal(isModalOpen, () => setIsModalOpen(false));
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marketing Coupons & Vouchers</h1>
          <p className="text-xs text-slate-500 mt-1">Create discount promotions, festive campaigns and cart incentives</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4">Min Order Value</th>
                <th className="py-3.5 px-4">Times Used</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-brand-primary block text-sm">{c.code}</span>
                    <span className="text-[11px] text-slate-400">{c.description || 'Pick2Buy promotion'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : c.type === 'FIXED' ? `₹${c.value} OFF` : 'Free Shipping'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {c.minOrderValue ? formatINR(c.minOrderValue) : 'No Minimum'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{c.usedCount || 0}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Coupons form" className="max-h-[calc(100dvh-2rem)] overflow-y-auto relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-black text-slate-900">Create New Coupon</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (e.g. FESTIVE25) *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono uppercase outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  <option value="PERCENTAGE">Percentage Discount (%)</option>
                  <option value="FIXED">Fixed Amount Discount (₹)</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Special festive season promo"
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
                  className="bg-brand-primary text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-brand-hover shadow-sm"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
