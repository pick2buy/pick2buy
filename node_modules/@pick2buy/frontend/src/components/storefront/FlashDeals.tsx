import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';

interface FlashDealsProps {
  products: any[];
}

export const FlashDeals: React.FC<FlashDealsProps> = ({ products }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 38,
    seconds: 22,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter((p) => p.isFlashDeal).slice(0, 4);
  if (flashProducts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-12">
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-soft">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none" />

        {/* Section Header with Live Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-2 border border-amber-400/20">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              Limited Time Deals
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pick2Buy Flash Sale
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Top bestselling electronics & essentials at steep discounts. Stock sells out fast.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mr-1">
              <Clock className="w-4 h-4 text-amber-400" /> Ends In:
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
              <span className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15">
                {String(timeLeft.hours).padStart(2, '0')}h
              </span>
              <span className="text-amber-400">:</span>
              <span className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </span>
              <span className="text-amber-400">:</span>
              <span className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15 text-amber-300">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {flashProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All link */}
        <div className="mt-8 text-center relative z-10">
          <Link
            to="/shop?flashDeal=true"
            className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-amber-300 transition-colors uppercase tracking-wider"
          >
            <span>View All Flash Deals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
