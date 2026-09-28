import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, RefreshCw, Truck, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Guarantees Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-primary">
              <Truck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fast Pan-India Delivery</h4>
              <p className="text-[11px] text-slate-400">Free shipping on orders ₹499+</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">7-Day Easy Returns</h4>
              <p className="text-[11px] text-slate-400">Hassle-free doorstep pickup</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-400">Pay when your order arrives</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Genuine Products</h4>
              <p className="text-[11px] text-slate-400">Directly sourced & verified</p>
            </div>
          </div>
        </div>

        {/* Links & Brand Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          {/* Brand Intro */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold flex items-center justify-center">
                P2B
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Pick2Buy</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Pick2Buy is India's rapidly growing ecommerce destination offering handpicked electronics, premium apparel, kitchen innovations, and fitness gear with express shipping across 19,000+ pin codes.
            </p>
            <div className="space-y-2 text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                <a href="mailto:pick2buy.in@gmail.com" className="hover:text-white transition-colors">
                  pick2buy.in@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary" />
                <span>+91 98765 43210 (Mon-Sat, 9AM-8PM IST)</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <span>Pick2Buy Hub, MG Road, Bengaluru, Karnataka 560001, India</span>
              </div>
            </div>
          </div>

          {/* Quick Shop Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Top Categories</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/category/electronics" className="hover:text-white transition-colors">Electronics & Audio</Link></li>
              <li><Link to="/category/mobile-accessories" className="hover:text-white transition-colors">Mobile Accessories</Link></li>
              <li><Link to="/category/fashion" className="hover:text-white transition-colors">Fashion & Apparel</Link></li>
              <li><Link to="/category/footwear" className="hover:text-white transition-colors">Footwear & Sneakers</Link></li>
              <li><Link to="/category/home-kitchen" className="hover:text-white transition-colors">Home & Kitchen</Link></li>
              <li><Link to="/category/health-fitness" className="hover:text-white transition-colors">Health & Fitness</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Customer Support</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/account" className="hover:text-white transition-colors">Track My Order</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">Submit Support Ticket</Link></li>
              <li><Link to="/shop?flashDeal=true" className="hover:text-white transition-colors">Flash Deals</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Stay in the Loop</h5>
            <p className="text-slate-400 text-xs">
              Subscribe to get ₹100 off your first purchase and exclusive access to festive flash deals.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully to Pick2Buy Insiders!'); }} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand-primary placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Get Discount Code
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Pick2Buy India. All rights reserved. Built for high performance.</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">UPI</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">RuPay</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">Visa</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">Mastercard</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">NetBanking</span>
            <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-medium">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
