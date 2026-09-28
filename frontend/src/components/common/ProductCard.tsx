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
  const { addItem, isLoading: isCartLoading } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discount = product.discountPercentage || Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
  const secondaryImage = product.images?.[1]?.url || primaryImage;

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
    <div className="group relative bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-soft transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Area */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

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
      </Link>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category / Brand label */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span className="truncate">{product.brand?.name || product.category?.name || 'Pick2Buy Exclusive'}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span>{product.averageRating || 4.8}</span>
              <span className="text-slate-500 text-[10px]">({product.reviewCount || 12})</span>
            </div>
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
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold">Free Delivery</p>
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
          >
            {justAdded ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
