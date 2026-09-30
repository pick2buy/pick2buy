import React from 'react';
import { useModal } from '../../hooks/useModal';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { formatINR } from '../../lib/utils';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isCartDrawerOpen, setCartDrawerOpen, updateQuantity, removeItem, isLoading } = useCartStore();

  const modalRef = useModal(isCartDrawerOpen, () => setCartDrawerOpen(false));
  if (!isCartDrawerOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const freeShippingThreshold = 499;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Shopping bag" className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-primary" />
              <h3 className="font-extrabold text-slate-900 text-base">Shopping Bag</h3>
              <span className="text-xs bg-indigo-50 text-brand-primary font-bold px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              aria-label="Close shopping bag" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Congratulations! You unlocked Free Shipping.
              </p>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-1.5">
                  Add <strong className="text-brand-primary font-bold">{formatINR(remainingForFreeShipping)}</strong> more to get <strong>Free Express Shipping</strong>!
                </p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-indigo-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-brand-primary">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Looks like you haven't added anything to your cart yet. Explore our trending products!
                </p>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/shop');
                  }}
                  className="mt-2 bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-3.5 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                  <img
                    src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={() => setCartDrawerOpen(false)}
                        className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-brand-primary transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Variant: {item.variant.name || item.variant.color || item.variant.size}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-900">
                          {formatINR(item.unitPrice)}
                        </span>
                        {item.product.mrp > item.unitPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatINR(item.product.mrp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isLoading}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatINR(cart?.subtotal || 0)}</span>
                </div>
                {cart?.couponDiscount ? (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({cart.couponCode})</span>
                    <span>-{formatINR(cart.couponDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {cart?.shipping === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(cart?.shipping || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-brand-primary">{formatINR(cart?.grandTotal || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  View Full Cart
                </button>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-2.5 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  Checkout
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shipping and payment options shown at checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
