import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  Check, 
  X, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatINR } from '../lib/utils';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    updateQuantity, 
    removeItem, 
    applyCoupon, 
    removeCoupon, 
    couponInput, 
    setCouponInput, 
    isLoading 
  } = useCartStore();

  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const availableCoupons = [
    { code: 'WELCOME10', desc: '10% off your first order (sign in required)' },
    { code: 'PICK2BUY100', desc: 'Flat ₹100 off on ₹999+' },
    { code: 'FREESHIP', desc: 'Free Shipping' },
  ];

  const handleApplyCoupon = async (code: string) => {
    setCouponError('');
    setIsApplying(true);
    try {
      await applyCoupon(code);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setIsApplying(false);
    }
  };

  const items = cart?.items || [];
  const isCartEmpty = items.length === 0;

  if (isCartEmpty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-brand-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 stroke-1" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Looks like you haven't added anything to your cart yet. Explore our latest deals and best sellers!
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8">
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm divide-y divide-slate-100">
            {items.map((item: any) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                <img
                  src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                  alt={item.product.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 bg-slate-50 flex-shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="text-sm font-bold text-slate-900 hover:text-brand-primary transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.variant && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Variant: <span className="font-semibold text-slate-700">{item.variant.name || item.variant.color}</span>
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatINR(item.unitPrice)}
                      </span>
                      {item.product.mrp > item.unitPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatINR(item.product.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500">Item Total: </span>
                      <strong className="text-sm font-black text-slate-900">{formatINR(item.totalPrice)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Security Note */}
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/60 flex items-center gap-3 text-xs text-indigo-950">
            <Truck className="w-5 h-5 text-brand-primary flex-shrink-0" />
            <span>
              Tracking details will appear in your order timeline after dispatch.
            </span>
          </div>
        </div>

        {/* Right: Coupon Box & Order Summary */}
        <div className="space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Apply Promo Coupon</h3>
            </div>

            {cart?.couponCode ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Coupon Applied: {cart.couponCode}
                  </p>
                  <p className="text-[11px] text-emerald-700">You saved {formatINR(cart.couponDiscount)}!</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-600 hover:underline p-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase outline-none focus:border-brand-primary"
                  />
                  <button
                    onClick={() => handleApplyCoupon(couponInput)}
                    disabled={!couponInput || isApplying}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-rose-500">{couponError}</p>}

                {/* Quick available chips */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Available Offers:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCouponInput(c.code);
                          handleApplyCoupon(c.code);
                        }}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-brand-primary text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Order Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Items)</span>
                <span className="font-semibold text-slate-900">{formatINR(cart?.subtotal || 0)}</span>
              </div>

              {cart?.discount ? (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product Discount</span>
                  <span>-{formatINR(cart.discount)}</span>
                </div>
              ) : null}

              {cart?.couponDiscount ? (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(cart.couponDiscount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span>
                  {cart?.shipping === 0 ? (
                    <strong className="text-emerald-600 font-bold uppercase">FREE</strong>
                  ) : (
                    formatINR(cart?.shipping || 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated GST (18%)</span>
                <span>{formatINR(cart?.tax || 0)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-xl text-brand-primary">{formatINR(cart?.grandTotal || 0)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Review payment and delivery details at checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
