import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Star } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';
import { formatINR } from '../lib/utils';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryQ = searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || '';
  const querySort = searchParams.get('sort') || 'featured';
  const queryFlash = searchParams.get('flashDeal') || '';
  const queryTrending = searchParams.get('trending') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState(querySort);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params: any = {
      q: queryQ,
      category: selectedCategory || undefined,
      maxPrice: maxPrice < 5000 ? maxPrice : undefined,
      inStock: inStockOnly ? 'true' : undefined,
      sort: sortOption,
      flashDeal: queryFlash || undefined,
      trending: queryTrending || undefined,
      limit: 40,
    };

    api.getProducts(params)
      .then((res) => {
        setProducts(res.data || []);
        setTotalCount(res.meta?.total || (res.data?.length || 0));
      })
      .finally(() => setIsLoading(false));
  }, [queryQ, selectedCategory, maxPrice, inStockOnly, sortOption, queryFlash, queryTrending]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setMaxPrice(5000);
    setInStockOnly(false);
    setSortOption('featured');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {queryQ ? `Results for "${queryQ}"` : 'All Products'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-900">{totalCount}</strong> items with verified pricing and fast dispatch
          </p>
        </div>

        {/* Mobile Filter Toggle & Sort Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Sort By:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-brand-primary"
            >
              <option value="featured">Featured & Recommended</option>
              <option value="newest">Newest Arrivals</option>
              <option value="bestseller">Best Sellers</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-primary" />
              Filter Products
            </h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-brand-primary hover:underline font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Categories</h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                  className="accent-brand-primary"
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug}
                    onChange={() => setSelectedCategory(cat.slug)}
                    className="accent-brand-primary"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Max Price</h4>
              <span className="font-bold text-brand-primary">{formatINR(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="499"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹499</span>
              <span>₹5,000+</span>
            </div>
          </div>

          {/* Availability Checkbox */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stock Status</h4>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No products match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your search terms, changing the maximum price filter, or selecting "All Categories".
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-3 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-hover transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-6 z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)}>
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="m-cat"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                    />
                    <span>All</span>
                  </label>
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="radio"
                        name="m-cat"
                        checked={selectedCategory === c.slug}
                        onChange={() => setSelectedCategory(c.slug)}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Max Price:</span>
                  <span>{formatINR(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="499"
                  max="5000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-primary"
                />
              </div>

              {/* In stock */}
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold text-xs shadow-md mt-6"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
