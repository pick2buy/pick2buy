import React from 'react';
import { ShoppingBag, Zap, Heart } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { useWishlistStore } from '../../store/useWishlistStore';

interface StickyMobileBuyBarProps {
  product: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
  };
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdding: boolean;
}

export const StickyMobileBuyBar: React.FC<StickyMobileBuyBarProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  isAdding,
}) => {
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  if (product.stock <= 0) return null;

  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-elevated">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold truncate">In Stock • Free Delivery</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2.5 rounded-xl border border-slate-200 ${
              wishlisted ? 'text-rose-500 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={onAddToCart}
            disabled={isAdding}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Bag</span>
          </button>

          <button
            onClick={onBuyNow}
            disabled={isAdding}
            className="bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
