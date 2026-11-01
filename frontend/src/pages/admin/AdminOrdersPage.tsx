import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Check, Search, Filter, Eye, X, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../lib/utils';
import { ORDER_STATUSES } from '@pick2buy/shared';
import { toast } from '../../store/useToastStore';

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
  const [returnNote, setReturnNote] = useState<Record<string, string>>({});
  const [updatingReturnId, setUpdatingReturnId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const updateReturn = async (requestId: string, status: string) => {
    setUpdatingReturnId(requestId);
    try {
      const response = await api.updateReturnRequest(requestId, { status, adminNote: returnNote[requestId]?.trim() });
      toast.success(response.message || 'Return request updated.');
      loadOrders();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update return request.'); }
    finally { setUpdatingReturnId(null); }
  };

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
      toast.success('Order status updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
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
                <th className="py-3.5 px-4 text-center">Details</th>
                <th className="py-3.5 px-4 text-right">Update Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
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
                      {ord.returnRequests?.length > 0 && <p className="mt-1 text-[10px] font-bold text-brand-primary">Return requested</p>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button type="button" onClick={() => setSelectedOrder(ord)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary px-2.5 py-1.5 text-[11px] font-bold text-brand-primary hover:bg-orange-50" aria-label={`View details for ${ord.orderNumber}`}>
                        <Eye size={14} /> View
                      </button>
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
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} returnNote={returnNote} setReturnNote={setReturnNote} updatingReturnId={updatingReturnId} onUpdateReturn={updateReturn} />}
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

const OrderDetailsModal: React.FC<{
  order: any; onClose: () => void; returnNote: Record<string, string>;
  setReturnNote: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updatingReturnId: string | null; onUpdateReturn: (requestId: string, status: string) => void;
}> = ({ order, onClose, returnNote, setReturnNote, updatingReturnId, onUpdateReturn }) => {
  let address: Record<string, string> = {};
  try { address = typeof order.shippingAddressJson === 'string' ? JSON.parse(order.shippingAddressJson) : (order.shippingAddressJson || {}); } catch { address = {}; }
  const addressLines = [address.addressLine, address.apartment, address.landmark, address.city, address.state, address.pincode].filter(Boolean);
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" aria-label="Close order details" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
    <section role="dialog" aria-modal="true" aria-label={`Order ${order.orderNumber} details`} className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"><div><p className="text-xs font-bold text-brand-primary">ORDER DETAILS</p><h2 className="mt-1 font-mono text-base font-black text-slate-900">{order.orderNumber}</h2><p className="mt-1 text-xs text-slate-500">Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={20} /></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4"><h3 className="mb-3 flex items-center gap-2 text-xs font-black text-slate-800"><Phone size={15} className="text-brand-primary" /> Customer</h3><p className="font-bold text-slate-900">{order.customerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-600"><Phone size={12} /> {order.customerPhone || 'Not provided'}</p><p className="mt-1 flex items-center gap-1 break-all text-xs text-slate-600"><Mail size={12} /> {order.customerEmail || 'Not provided'}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><h3 className="mb-3 flex items-center gap-2 text-xs font-black text-slate-800"><MapPin size={15} className="text-brand-primary" /> Delivery address</h3><p className="font-semibold text-slate-900">{address.fullName || order.customerName}</p><p className="mt-1 text-xs leading-5 text-slate-600">{addressLines.length ? addressLines.join(', ') : 'Address not available'}</p></div>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 p-4 text-xs sm:grid-cols-3"><div><p className="text-slate-500">Total</p><p className="mt-1 font-black text-slate-900">{formatINR(order.grandTotal)}</p></div><div><p className="text-slate-500">Payment</p><p className="mt-1 font-bold text-slate-900">{order.paymentMethod} · {order.paymentStatus}</p></div><div><p className="text-slate-500">Shipping</p><p className="mt-1 font-bold text-slate-900">{order.status}</p>{order.courierName && <p className="mt-1 text-slate-600">{order.courierName}: {order.trackingNumber}</p>}</div></div>
      <div className="mt-5"><h3 className="text-sm font-black text-slate-900">Order items</h3><div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">{order.items?.length ? order.items.map((item: any) => <div key={item.id} className="flex items-start justify-between gap-4 py-3 text-xs"><div><p className="font-bold text-slate-800">{item.productName}</p><p className="mt-0.5 text-slate-500">{item.variantName ? `${item.variantName} · ` : ''}SKU: {item.sku} · Qty {item.quantity}</p></div><p className="shrink-0 font-black text-slate-900">{formatINR(item.total)}</p></div>) : <p className="py-3 text-xs text-slate-500">Item details not available.</p>}</div></div>
      {order.returnRequests?.length > 0 && <div className="mt-5 border-t border-slate-100 pt-5"><h3 className="text-sm font-black text-slate-900">Return requests</h3><div className="mt-2 space-y-3">{order.returnRequests.map((request: any) => <div key={request.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-slate-900">{request.orderItem?.productName}</p><p className="mt-1 text-slate-600">{request.reason.replaceAll('_', ' ')} · Qty {request.orderItem?.quantity}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{request.status}</span></div><p className="mt-3 whitespace-pre-wrap text-slate-700">{request.message}</p>{request.adminNote && <p className="mt-2 text-slate-600">Staff note: {request.adminNote}</p>}{['REQUESTED', 'APPROVED', 'RECEIVED'].includes(request.status) && <div className="mt-3 space-y-2"><input aria-label={`Staff note for ${request.orderItem?.productName}`} value={returnNote[request.id] || ''} onChange={event => setReturnNote(current => ({ ...current, [request.id]: event.target.value }))} placeholder="Staff note (needed to reject)" maxLength={1000} className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2" /><div className="flex flex-wrap gap-2">{(request.status === 'REQUESTED' ? ['APPROVED', 'REJECTED'] : request.status === 'APPROVED' ? ['RECEIVED'] : ['COMPLETED']).map(status => <button key={status} type="button" disabled={updatingReturnId === request.id || (status === 'REJECTED' && !returnNote[request.id]?.trim())} onClick={() => onUpdateReturn(request.id, status)} className="rounded-lg bg-brand-primary px-3 py-2 font-bold text-white disabled:opacity-50">{status === 'RECEIVED' ? 'Mark received' : status === 'COMPLETED' ? 'Complete return' : status === 'APPROVED' ? 'Approve' : 'Reject'}</button>)}</div></div>}</div>)}</div></div>}
    </section>
  </div>;
};
