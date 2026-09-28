import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones, Award } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: Truck,
      title: 'Free India Shipping',
      desc: 'On all prepaid & COD orders over ₹499',
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Guarantee',
      desc: 'Direct manufacturer authorized sourcing',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: RefreshCw,
      title: '7-Day Easy Returns',
      desc: 'Instant doorstep exchange or refund',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      desc: 'Expert assistance via email & chat',
      color: 'text-sky-600 bg-sky-50',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div key={idx} className="flex items-center gap-3.5 p-2">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {badge.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {badge.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
