import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Check, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
import { ORDER_STATUSES } from '@pick2buy/shared';

const fulfillmentStatuses = Object.values(ORDER_STATUSES).filter(status =>
  status !== ORDER_STATUSES.RETURNED && status !== ORDER_STATUSES.REFUNDED);
const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'], PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'], OUT_FOR_DELIVERY: ['DELIVERED'],
};

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [shipmentDraft, setShipmentDraft] = useState<{ orderId: string; trackingNumber: string; courierName: string } | null>(null);

  const loadOrders = () => {
    setIsLoading(true);
    setLoadError('');
    api.getAdminOrders({ page, q: search, status: statusFilter })
      .then((res) => {
        setOrders(res.data || []);
        setTotal(res.meta?.total || 0);
      })
      .catch((err) => setLoadError(err.message || 'Could not load orders'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [page, search, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string, shipping?: { trackingNumber: string; courierName: string }) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, {
        status: newStatus,
        comment: `Order status changed to ${newStatus} by admin`,
        ...shipping,
      });
      setShipmentDraft(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-500 mt-1">Review orders, update dispatch tracking and manage customer fulfillments</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order # or customer..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-brand-primary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="ALL">All Statuses</option>
            {fulfillmentStatuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {shipmentDraft && <form className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm" onSubmit={(e) => {
        e.preventDefault();
        if (!shipmentDraft.trackingNumber.trim() || !shipmentDraft.courierName.trim()) return;
        handleStatusChange(shipmentDraft.orderId, ORDER_STATUSES.SHIPPED, {
          trackingNumber: shipmentDraft.trackingNumber.trim(), courierName: shipmentDraft.courierName.trim(),
        });
      }}>
        <h2 className="mb-3 font-bold text-slate-900">Shipping details</h2>
        <div className="flex flex-wrap gap-3">
          <input required aria-label="Courier name" placeholder="Courier name" className="rounded-xl border border-slate-300 px-3 py-2" value={shipmentDraft.courierName} onChange={e => setShipmentDraft({ ...shipmentDraft, courierName: e.target.value })} />
          <input required aria-label="Tracking number" placeholder="Tracking number" className="rounded-xl border border-slate-300 px-3 py-2" value={shipmentDraft.trackingNumber} onChange={e => setShipmentDraft({ ...shipmentDraft, trackingNumber: e.target.value })} />
          <button disabled={Boolean(updatingId)} className="rounded-xl bg-brand-primary px-4 py-2 font-bold text-white">Mark shipped</button>
          <button type="button" onClick={() => setShipmentDraft(null)} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
        </div>
      </form>}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order Reference</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Shipping Status</th>
                <th className="py-3.5 px-4 text-right">Update Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {isLoading ? 'Loading orders…' : loadError || 'No orders found matching filters.'}
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{ord.orderNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-400">{ord.customerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {formatINR(ord.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px] block w-fit">
                        {ord.paymentMethod}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-block ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-sky-100 text-sky-800'
                            : ord.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-brand-primary'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        disabled={updatingId === ord.id}
                        onChange={(e) => e.target.value === ORDER_STATUSES.SHIPPED
                          ? setShipmentDraft({ orderId: ord.id, trackingNumber: ord.trackingNumber || '', courierName: ord.courierName || '' })
                          : handleStatusChange(ord.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-primary"
                      >
                        {[ord.status, ...(nextStatuses[ord.status] || [])].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{total} orders · Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40" disabled={page <= 1 || isLoading} onClick={() => setPage(p => p - 1)}>Previous</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-40" disabled={page * 20 >= total || isLoading} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};
