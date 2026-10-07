import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronDown, 
  Truck, 
  ShieldCheck, 
  Zap, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { cart, setCartDrawerOpen, fetchCart } = useCartStore();
  const { items: wishlistItems, fetchWishlist } = useWishlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
    api.getCategories().then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  const menuRef = useModal(isMobileMenuOpen, () => setIsMobileMenuOpen(false));
  const totalCartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="store-header sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Announcement Bar */}
      <div className="announcement bg-slate-900 text-slate-100 text-xs py-2 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Special Offer
            </span>
            <span className="hidden sm:inline">Free Shipping across India on orders above ₹499!</span>
            <span className="sm:hidden">Free India shipping over ₹499</span>
          </div>
          <div className="announcement-contact flex items-center gap-4 text-[11px] text-slate-300">
            <span className="hidden md:inline">First order? Use <strong className="text-white">WELCOME10</strong> when signed in</span>
            <span className="text-slate-400">|</span>
            <a href="mailto:pick2buy.in@gmail.com" className="hover:text-white transition-colors">
              pick2buy.in@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="header-main-row flex items-center justify-between gap-4">
          {/* Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="header-brand-icon w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                P2B
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Pick<span className="text-brand-primary">2</span>Buy
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  India's Store
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                aria-label="Search products" type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, electronics, apparel..."
                className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm text-slate-800 rounded-full pl-11 pr-24 py-2.5 border border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shadow-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* Right Action Icons */}
          <div className="header-actions flex items-center gap-2 sm:gap-4">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 text-slate-700 hover:text-brand-primary rounded-full hover:bg-slate-100 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2 text-slate-700 hover:text-brand-primary rounded-full hover:bg-slate-100 transition-colors"
              title="Shopping Cart" aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div className="relative">
              {user ? (
                <button
                  aria-label="Account menu" aria-expanded={isUserMenuOpen} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-brand-primary font-bold text-xs flex items-center justify-center border border-indigo-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden xl:inline text-xs font-semibold text-slate-800">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden xl:inline" />
                </button>
              ) : (
                <Link
                  to="/login" aria-label="Sign in"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-primary py-2 px-3 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* User Dropdown */}
              {user && isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-elevated border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Admin Access
                      </span>
                    )}
                  </div>

                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-primary hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Control Panel
                    </Link>
                  )}

                  <Link
                    to="/account"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    My Account & Orders
                  </Link>

                  <Link
                    to="/wishlist"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    My Wishlist
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              aria-label="Search products" type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-100 text-sm text-slate-800 rounded-full pl-10 pr-20 py-2 border border-slate-200 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-primary text-white text-xs font-semibold px-3 py-1 rounded-full"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Category Bar / Mega Menu */}
      <nav className="hidden lg:block border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-6 py-2.5">
            <Link to="/shop" className="hover:text-brand-primary transition-colors">
              All Products
            </Link>

            <div
              className="relative py-1 group"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)} aria-expanded={isMegaMenuOpen} className="flex items-center gap-1 hover:text-brand-primary transition-colors">
                Categories
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Mega Menu Dropdown */}
              {isMegaMenuOpen && (
                <div className="absolute top-full left-0 w-[640px] bg-white rounded-2xl shadow-elevated border border-slate-200 p-6 z-50 grid grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsMegaMenuOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-primary font-bold text-xs flex-shrink-0">
                        {cat.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover/item:text-brand-primary transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {cat.description || 'Explore top rated products'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/shop?sort=newest" className="hover:text-brand-primary transition-colors">
              New Arrivals
            </Link>
            <Link to="/shop?sort=bestseller" className="hover:text-brand-primary transition-colors">
              Best Sellers
            </Link>
            <Link to="/shop?flashDeal=true" className="flex items-center gap-1 text-brand-accent font-bold hover:underline">
              <Zap className="w-3.5 h-3.5 fill-brand-accent" />
              Flash Deals
            </Link>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" /> Express Dispatch
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" /> Support available
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && createPortal(
        <div className="lg:hidden fixed inset-0 z-[60] flex h-screen h-[100dvh]">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div ref={menuRef} role="dialog" aria-modal="true" aria-label="Navigation" className="relative z-10 flex h-full w-4/5 max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary text-white font-bold flex items-center justify-center">
                  P2B
                </div>
                <span className="font-black text-slate-900 text-lg">Pick2Buy</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation" className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 px-3 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 px-3 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                All Products
              </Link>
              <Link
                to="/shop?flashDeal=true"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold text-brand-accent rounded-lg hover:bg-orange-50"
              >
                <Zap className="w-4 h-4 fill-brand-accent" />
                Flash Deals
              </Link>
            </div>

            <div className="py-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Categories
              </p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 px-3 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              {user ? (
                <div>
                  <p className="text-xs font-bold text-slate-900 mb-1">{user.name}</p>
                  <p className="text-xs text-slate-500 mb-3">{user.email}</p>
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center bg-slate-100 text-slate-800 py-2 rounded-lg text-xs font-bold mb-2"
                  >
                    Account & Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-center text-xs font-semibold text-rose-600 py-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2 text-xs font-bold text-white bg-brand-primary rounded-lg"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
