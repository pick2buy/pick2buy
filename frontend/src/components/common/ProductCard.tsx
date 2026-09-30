import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    discountPercentage?: number;
    stock: number;
    averageRating?: number;
    reviewCount?: number;
    images?: { url: string; altText?: string }[];
    category?: { name: string; slug: string };
    brand?: { name: string };
    isFlashDeal?: boolean;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discount = product.discountPercentage ?? (product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);
  const primaryImage = product.images?.[0]?.url || '/product-placeholder.svg';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAdding(true);
      await addItem(product.id, null, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to bag');
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please sign in to save items to your wishlist!');
      return;
    }
    try {
      await toggleWishlist(product.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeWishlist = isWishlisted(product.id);

  return (
    <article className="product-card group relative bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Area */}
      <div className="product-card-image relative block aspect-square overflow-hidden bg-slate-50">
      <Link to={`/product/${product.slug}`} aria-label={product.name}>
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/product-placeholder.svg'; }}
        />

      </Link>
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discount > 0 && (
            <span className="bg-brand-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              {discount}% OFF
            </span>
          )}
          {product.isFlashDeal && (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              Flash Deal
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            activeWishlist
              ? 'bg-rose-50 text-rose-500 shadow-sm'
              : 'bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-rose-500 shadow-sm'
          }`}
          title="Save to Wishlist"
          aria-label={activeWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <Heart className={`w-4 h-4 ${activeWishlist ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Out of Stock Overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="product-info p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category / Brand label */}
          <div className="product-meta flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span className="truncate">{product.brand?.name || product.category?.name || 'Pick2Buy Exclusive'}</span>
            {Boolean(product.reviewCount) && <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span>{product.averageRating}</span>
              <span className="text-slate-500 text-[10px]">({product.reviewCount})</span>
            </div>}
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.slug}`}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-brand-primary transition-colors leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="product-pricing mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="product-prices flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Shipping shown at checkout</p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isAdding}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-primary hover:bg-brand-hover text-white shadow-sm hover:shadow'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Add to Cart"
            aria-label={`Add ${product.name} to cart`}
          >
            {justAdded ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
