import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatINR } from '../lib/utils';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, fetchWishlist, toggleWishlist, moveToCart } = useWishlistStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleMoveToCart = async (productId: string) => {
    try {
      await moveToCart(productId);
      await fetchCart();
    } catch (err: any) {
      alert(err.message || 'Failed to move item to bag');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Sign in to View Your Wishlist</h2>
        <p className="text-xs text-slate-500">
          Save your favorite items across devices and receive notifications when prices drop.
        </p>
        <Link
          to="/login"
          className="inline-block bg-brand-primary text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-sm hover:bg-brand-hover transition-colors"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500">
          Explore products you love and click the heart icon to save them for later!
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-sm hover:bg-brand-hover transition-colors"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between hover:shadow-soft transition-all"
          >
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3">
                <img
                  src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleWishlist(item.productId)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-white shadow-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                to={`/product/${item.product?.slug}`}
                className="text-xs font-bold text-slate-900 hover:text-brand-primary line-clamp-2 leading-snug"
              >
                {item.product?.name}
              </Link>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-sm font-black text-slate-900">
                  {formatINR(item.product?.price || 0)}
                </span>
                {item.product?.mrp > item.product?.price && (
                  <span className="text-[11px] text-slate-400 line-through">
                    {formatINR(item.product?.mrp)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleMoveToCart(item.productId)}
              className="mt-4 w-full bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Move to Bag</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
