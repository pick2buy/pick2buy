import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    api.getCategory(slug)
      .then((res) => {
        setCategory(res.data);
        setProducts(res.data?.products || []);
      })
      .catch(() => {
        setCategory(null);
        setProducts([]);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-40 rounded-3xl bg-slate-100 animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-800">Category Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-4">The requested category does not exist.</p>
        <Link to="/shop" className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl">
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/shop" className="hover:text-slate-800">Categories</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-900">{category.name}</span>
      </nav>

      {/* Category Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-soft">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Category Collection
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {category.description || 'Explore our high quality handpicked items with fast pan-India shipping.'}
          </p>
          <p className="text-xs text-brand-accent font-bold pt-1">
            {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="pt-4">
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-sm font-semibold text-slate-700">No products available in this category yet.</p>
            <Link to="/shop" className="inline-block mt-3 text-xs font-bold text-brand-primary hover:underline">
              Explore other categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
