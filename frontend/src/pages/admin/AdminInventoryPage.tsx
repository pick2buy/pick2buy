import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, Plus, Minus, Check, ArrowUpDown } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';

export const AdminInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(10);
  const [adjustmentReason, setAdjustmentReason] = useState('RESTOCK');
  const [isLoading, setIsLoading] = useState(true);

  const loadInventory = () => {
    setIsLoading(true);
    api.getAdminInventory()
      .then((res) => setInventory(res.data || []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.adjustStock({
        productId: selectedProduct.id,
        quantityChange: adjustmentAmount,
        reason: adjustmentReason,
      });
      setSelectedProduct(null);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const lowStockCount = inventory.filter((p) => p.stock <= p.lowStockThreshold).length;

  const modalRef = useModal(!!selectedProduct, () => setSelectedProduct(null));
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Control & Stock Logs</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time inventory levels, reorder thresholds and stock ledger adjustments</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{lowStockCount} Products Need Restocking</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Item SKU</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.sku}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.category?.name}</td>
                  <td className="py-3.5 px-4 font-black text-sm text-slate-900">{item.stock}</td>
                  <td className="py-3.5 px-4">
                    {item.stock <= 0 ? (
                      <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    ) : item.stock <= item.lowStockThreshold ? (
                      <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        Low Stock (≤{item.lowStockThreshold})
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        Optimal Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedProduct(item);
                        setAdjustmentAmount(10);
                        setAdjustmentReason('RESTOCK');
                      }}
                      className="bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Inventory form" className="max-h-[calc(100dvh-2rem)] overflow-y-auto relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-black text-slate-900">Adjust Stock for:</h3>
            <p className="text-xs font-bold text-brand-primary">{selectedProduct.name} ({selectedProduct.sku})</p>
            <p className="text-xs text-slate-500">Current available inventory: <strong>{selectedProduct.stock} units</strong></p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Quantity (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  placeholder="e.g. 25 or -5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Positive value increases inventory; negative value deducts inventory.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Audit Log</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  <option value="RESTOCK">RESTOCK (Supplier replenishment)</option>
                  <option value="RETURN">CUSTOMER_RETURN (Restocked to warehouse)</option>
                  <option value="DAMAGE">DAMAGE (Removed from sale)</option>
                  <option value="ADJUSTMENT">AUDIT_ADJUSTMENT (Cycle count reconciliation)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-brand-hover shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
