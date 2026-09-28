import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Truck, Home } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-soft space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Thank You for Shopping with Pick2Buy!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your order has been recorded in our dispatch fulfillment queue. We've sent a detailed invoice & confirmation receipt to your email.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block text-left text-xs space-y-1">
          <p className="text-slate-500">Pick2Buy Order Reference:</p>
          <p className="text-base font-black font-mono text-brand-primary">{orderNumber}</p>
          <p className="text-slate-500 pt-1">Estimated Delivery: <strong>3-4 Business Days</strong></p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/account/orders/${orderNumber}`}
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Timeline</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
