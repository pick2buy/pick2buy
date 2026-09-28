import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <span className="bg-indigo-100 text-brand-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Shipment Timeline</h2>

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
                        ? 'bg-brand-primary text-white ring-4 ring-indigo-100 animate-pulse'
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
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>Shipping Destination</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
            <p>Phone: {order.customerPhone}</p>
            <p>Email: {order.customerEmail}</p>
            <p className="pt-1">{order.shippingAddress?.addressLine}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-brand-primary" />
            <span>Payment & Invoice</span>
          </div>
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
        </div>
      </div>

      {/* Ordered Products Items */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Items in This Shipment</h3>
        <div className="divide-y divide-slate-100">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{item.productName}</p>
                <p className="text-[11px] text-slate-400">SKU: {item.sku} • Qty: {item.quantity}</p>
              </div>
              <strong className="font-extrabold text-slate-900">{formatINR(item.total)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
