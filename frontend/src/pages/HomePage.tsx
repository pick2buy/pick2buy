import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Award, 
  Star, 
  CheckCircle2, 
  TrendingUp,
  Package,
  Layers
} from 'lucide-react';
import { HeroBanner } from '../components/storefront/HeroBanner';
import { TrustBadges } from '../components/storefront/TrustBadges';
import { FlashDeals } from '../components/storefront/FlashDeals';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getProducts({ limit: 30 }),
    ])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const trendingProducts = products.filter((p) => p.isTrending).slice(0, 8);
  const bestSellerProducts = products.filter((p) => p.isBestSeller).slice(0, 8);

  const testimonials = [
    {
      name: 'Rohan Deshmukh',
      role: 'Tech Consultant, Bengaluru',
      rating: 5,
      comment: 'Ordered the 65W GaN charger and ANC earbuds. Delivered to Indiranagar within 24 hours! Genuine build quality and best pricing online.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    },
    {
      name: 'Sneha Kulkarni',
      role: 'Architect, Pune',
      rating: 5,
      comment: 'The French linen shirts and bamboo notebook exceeded my expectations. Smooth checkout and seamless Cash on Delivery support.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    },
    {
      name: 'Arjun Mehta',
      role: 'Fitness Enthusiast, Delhi',
      rating: 5,
      comment: 'The CloudStride running shoes and percussion massage gun have become daily essentials. Pick2Buy customer service is extraordinarily responsive.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120',
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Hero Carousel */}
      <HeroBanner />

      {/* 2. Trust Badges */}
      <TrustBadges />

      {/* 3. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Browse Collections
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-primary transition-colors"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-soft transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 group-hover:bg-brand-primary text-brand-primary group-hover:text-white flex items-center justify-center font-black text-lg transition-colors mb-2.5">
                {cat.name.charAt(0)}
              </div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-brand-primary transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Explore</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Flash Sale Deals */}
      <FlashDeals products={products} />

      {/* 5. Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Trending Products This Week
            </h2>
          </div>
          <Link
            to="/shop?trending=true"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-primary transition-colors"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Promotional Mid-Season Feature Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-12">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-soft">
          <div className="max-w-xl space-y-4">
            <span className="bg-brand-accent text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Pick2Buy Guarantee
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Fast, Reliable & Transparent Shopping. Direct to Your Doorstep.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We partner with verified manufacturing hubs to bring you premium tech, apparel, and lifestyle upgrades without bloated retail markups. Enjoy verified reviews and instant COD verification.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/shop"
                className="bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 rounded-full transition-all shadow-md"
              >
                Shop All Deals
              </Link>
              <Link
                to="/category/electronics"
                className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-colors border border-white/20"
              >
                Explore Tech
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">50K+</span>
              <p className="text-[11px] text-slate-300 mt-1">Happy Shoppers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">19K+</span>
              <p className="text-[11px] text-slate-300 mt-1">Pincodes Served</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-2xl sm:text-3xl font-black text-sky-300">4.8/5</span>
              <p className="text-[11px] text-slate-300 mt-1">Average Rating</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-2xl sm:text-3xl font-black text-indigo-300">24h</span>
              <p className="text-[11px] text-slate-300 mt-1">Dispatch Speed</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Best Sellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Top Rated</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Pick2Buy Best Sellers
            </h2>
          </div>
          <Link
            to="/shop?sort=bestseller"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-primary transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestSellerProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 8. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
            Verified Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Loved by Customers Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Read real feedback from shoppers who made Pick2Buy their preferred online store.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {t.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                  </h4>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
