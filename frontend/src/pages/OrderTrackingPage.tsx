import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Printer 
  , ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const CollapseSection: React.FC<{ title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, icon, open, onToggle, children }) => (
  <section className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 sm:p-6 text-left hover:bg-slate-50 transition-colors">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">{icon}{title}</span>
      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t border-slate-100 p-5 sm:p-6">{children}</div>}
  </section>
);

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [returnItemId, setReturnItemId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnMessage, setReturnMessage] = useState('');
  const [returnError, setReturnError] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [openSection, setOpenSection] = useState<'timeline' | 'shipping' | 'payment' | 'items'>('timeline');
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderNumber) return;
    setIsLoading(true);
    api.getOrderByNumber(orderNumber)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error('Failed to load order:', err))
      .finally(() => setIsLoading(false));
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-4">No order was found matching #{orderNumber}.</p>
        <Link to="/" className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl">
          Return to Home
        </Link>
      </div>
    );
  }

  // Calculate current step index
  const currentStepIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((s) => s.key === order.status)
  );
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && Boolean(localStorage.getItem('pick2buy_token'));
  const deliveredAt = order.timeline?.find((entry: any) => entry.status === 'DELIVERED')?.createdAt;
  const returnOpen = order.status === 'DELIVERED' && deliveredAt && Date.now() <= new Date(deliveredAt).getTime() + 7 * 86400000;
  const submitReturn = async () => {
    if (!returnItemId || returnReason.trim().length < 3 || returnMessage.trim().length < 10) { setReturnError('Select a reason and enter at least 10 characters.'); return; }
    setIsReturning(true); setReturnError('');
    try { await api.requestReturn(order.id, { orderItemId: returnItemId, reason: returnReason, message: returnMessage }); const refreshed = await api.getOrderByNumber(order.orderNumber); setOrder(refreshed.data); setReturnItemId(null); setReturnReason(''); setReturnMessage(''); }
    catch (error) { setReturnError(error instanceof Error ? error.message : 'Could not submit return request'); }
    finally { setIsReturning(false); }
  };
  const cancelOrder = async () => {
    if (cancelReason.trim().length < 5) { setCancelError('Please provide at least 5 characters.'); return; }
    setIsCancelling(true);
    try {
      await api.cancelOrder(order.id, cancelReason.trim());
      setOrder((current: any) => ({ ...current, status: 'CANCELLED', cancellationReason: cancelReason.trim() }));
      setCancelOpen(false); setCancelReason(''); setCancelError('');
      navigate(`/order-cancelled/${encodeURIComponent(order.orderNumber)}`);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Could not cancel the order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link to="/account" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Account & Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Order #{order.orderNumber}
            </h1>
            <span className="bg-orange-100 text-brand-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>

        <button
          onClick={() => navigate(`/account/orders/${encodeURIComponent(order.orderNumber)}/receipt`)}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
        {canCancel && <button type="button" onClick={() => setCancelOpen(true)} disabled={isCancelling} className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 shadow-sm disabled:opacity-50">
          {isCancelling ? 'Cancelling…' : 'Cancel order'}
        </button>}
      </div>

      {cancelOpen && <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <form onSubmit={(e) => { e.preventDefault(); void cancelOrder(); }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Cancel this order?</h2>
          <p className="text-sm text-slate-500">Tell us why you want to cancel. This helps us improve.</p>
          <textarea required minLength={5} maxLength={500} value={cancelReason} onChange={e => { setCancelReason(e.target.value); setCancelError(''); }} className="w-full min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-primary" placeholder="Cancellation reason" />
          {cancelError && <p className="text-xs text-rose-600">{cancelError}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setCancelOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Keep order</button><button type="submit" disabled={isCancelling} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">{isCancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></div>
        </form>
      </div>}

      {/* Progress Timeline Tracker */}
      <CollapseSection title="Shipment Timeline" icon={<Clock className="w-4 h-4 text-brand-primary" />} open={openSection === 'timeline'} onToggle={() => setOpenSection(openSection === 'timeline' ? 'shipping' : 'timeline')}>

        <div className="relative">
          {/* Horizontal Line on Desktop */}
          <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-brand-primary transition-all duration-500"
              style={{
                width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-4 relative z-10">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-primary text-white ring-4 ring-orange-100 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-brand-primary'
                          : isPast
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] text-brand-accent font-semibold block">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier Tracking Info */}
        {order.trackingNumber && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-brand-primary" />
              <div>
                <p className="font-bold text-slate-800">
                  Carrier: {order.courierName || 'Pick2Buy Express Dispatch'}
                </p>
                <p className="text-slate-500">AWB Tracking Number: <strong className="font-mono text-slate-900">{order.trackingNumber}</strong></p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px] self-start sm:self-auto">
              In Transit
            </span>
          </div>
        )}
      </CollapseSection>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <CollapseSection title="Shipping Destination" icon={<MapPin className="w-4 h-4 text-brand-primary" />} open={openSection === 'shipping'} onToggle={() => setOpenSection(openSection === 'shipping' ? 'timeline' : 'shipping')}>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
            <p>Phone: {order.customerPhone}</p>
            <p>Email: {order.customerEmail}</p>
            <p className="pt-1">{order.shippingAddress?.addressLine}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          </div>
        </CollapseSection>

        {/* Payment Summary */}
        <CollapseSection title="Payment & Invoice" icon={<CreditCard className="w-4 h-4 text-brand-primary" />} open={openSection === 'payment'} onToggle={() => setOpenSection(openSection === 'payment' ? 'timeline' : 'payment')}>
          <div className="text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode:</span>
              <strong className="text-slate-900">{order.paymentMethod}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Status:</span>
              <strong className="text-emerald-600 uppercase">{order.paymentStatus}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatINR(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping:</span>
              <span>{order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm text-slate-900">
              <span>Grand Total:</span>
              <span className="text-brand-primary">{formatINR(order.grandTotal)}</span>
            </div>
          </div>
        </CollapseSection>
      </div>

      {/* Ordered Products Items */}
      <CollapseSection title="Items in This Shipment" icon={<Package className="w-4 h-4 text-brand-primary" />} open={openSection === 'items'} onToggle={() => setOpenSection(openSection === 'items' ? 'timeline' : 'items')}>
        <div className="divide-y divide-slate-100">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{item.productName}</p>
                <p className="text-[11px] text-slate-400">SKU: {item.sku} • Qty: {item.quantity}</p>
              </div>
              <strong className="font-extrabold text-slate-900">{formatINR(item.total)}</strong>
              {returnOpen && !order.returnRequests?.some((request: any) => request.orderItemId === item.id) && <button type="button" onClick={() => setReturnItemId(item.id)} className="ml-3 rounded-lg border border-brand-primary px-2 py-1 font-bold text-brand-primary">Request return</button>}
            </div>
          ))}
        </div>
        {returnOpen && <p className="text-xs text-emerald-700">Items are eligible for return until {new Date(new Date(deliveredAt).getTime() + 7 * 86400000).toLocaleDateString('en-IN')}.</p>}
      </CollapseSection>
      {returnItemId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3"><h2 className="text-lg font-bold">Request a return</h2><select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full rounded-xl border p-3 text-sm"><option value="">Choose a reason</option><option>Damaged or defective</option><option>Wrong item received</option><option>Not as described</option><option>Changed my mind</option></select><textarea value={returnMessage} onChange={e => setReturnMessage(e.target.value)} minLength={10} className="w-full min-h-24 rounded-xl border p-3 text-sm" placeholder="Tell us what happened" />{returnError && <p className="text-xs text-rose-600">{returnError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setReturnItemId(null)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button><button onClick={() => void submitReturn()} disabled={isReturning} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white">{isReturning ? 'Submitting…' : 'Submit request'}</button></div></div></div>}
    </div>
  );
};
