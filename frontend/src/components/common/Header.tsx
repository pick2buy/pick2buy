import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
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
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const { user, logout } = useAuthStore();
  const { cart, setCartDrawerOpen, fetchCart } = useCartStore();
  const { items: wishlistItems, fetchWishlist } = useWishlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const categoryNavRef = useRef<HTMLElement>(null);
  const [categoryScroll, setCategoryScroll] = useState({ left: false, right: false });
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [categoryMenuLeft, setCategoryMenuLeft] = useState(8);
  const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null);
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

  useEffect(() => {
    const strip = categoryStripRef.current;
    if (!strip) return;

    const updateScrollButtons = () => {
      const next = {
        left: strip.scrollLeft > 1,
        right: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1,
      };
      setCategoryScroll((current) =>
        current.left === next.left && current.right === next.right ? current : next
      );
    };

    updateScrollButtons();
    strip.addEventListener('scroll', updateScrollButtons, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(strip);
    return () => {
      strip.removeEventListener('scroll', updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [categories, isAuthPage]);

  useEffect(() => {
    setOpenCategoryId(null);
    setExpandedMobileCategoryId(null);
  }, [pathname]);

  useEffect(() => {
    if (!openCategoryId) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!categoryNavRef.current?.contains(event.target as Node)) setOpenCategoryId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenCategoryId(null);
    };
    const closeOnResize = () => setOpenCategoryId(null);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [openCategoryId]);

  const toggleCategoryDropdown = (categoryId: string, button: HTMLButtonElement) => {
    const nav = categoryNavRef.current;
    if (nav) {
      const triggerLeft = (button.parentElement || button).getBoundingClientRect().left - nav.getBoundingClientRect().left;
      const menuWidth = Math.min(320, nav.clientWidth - 16);
      setCategoryMenuLeft(Math.max(8, Math.min(triggerLeft, nav.clientWidth - menuWidth - 8)));
    }
    setOpenCategoryId(current => current === categoryId ? null : categoryId);
  };

  const scrollCategories = (direction: -1 | 1) => {
    const strip = categoryStripRef.current;
    if (!strip) return;
    setOpenCategoryId(null);
    strip.scrollBy({ left: direction * Math.max(strip.clientWidth * 0.75, 240), behavior: 'smooth' });
  };

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
        <div className={`${isAuthPage ? 'hidden' : 'mt-3'} md:hidden`}>
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
                <div className="absolute top-full left-0 w-[760px] max-h-[min(70vh,520px)] overflow-y-auto bg-white rounded-2xl shadow-elevated border border-slate-200 p-6 z-50 grid grid-cols-3 gap-3">
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

      {!isAuthPage && categories.length > 0 && (
        <nav ref={categoryNavRef} aria-label="Shop categories" onMouseLeave={() => setOpenCategoryId(null)} className="relative border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-2 text-sm text-slate-800 sm:gap-2 sm:px-4">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              disabled={!categoryScroll.left}
              aria-label="Scroll categories left"
              className="flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent sm:w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div ref={categoryStripRef} className="category-strip-scroll flex min-w-0 flex-1 items-center gap-5 overflow-x-auto text-sm sm:gap-6">
              <Link to="/shop?sort=bestseller" className="shrink-0 whitespace-nowrap py-3 font-medium hover:text-brand-primary">
                Popular
              </Link>
              {categories.map((cat) => (
                <div key={cat.id} className="flex shrink-0 items-center">
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={() => setOpenCategoryId(null)}
                    aria-current={pathname === `/category/${cat.slug}` ? 'page' : undefined}
                    className={`whitespace-nowrap border-b-2 py-3 transition-colors hover:text-brand-primary ${pathname === `/category/${cat.slug}` ? 'border-brand-primary text-brand-primary' : 'border-transparent'}`}
                  >
                    {cat.name}
                  </Link>
                  {cat.children?.length > 0 && <button
                    type="button"
                    aria-label={`Show ${cat.name} subcategories`}
                    aria-expanded={openCategoryId === cat.id}
                    aria-controls={`category-submenu-${cat.id}`}
                    onClick={event => toggleCategoryDropdown(cat.id, event.currentTarget)}
                    className="ml-0.5 flex h-8 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-brand-primary"
                  ><ChevronDown className={`h-3.5 w-3.5 transition-transform ${openCategoryId === cat.id ? 'rotate-180' : ''}`} /></button>}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              disabled={!categoryScroll.right}
              aria-label="Scroll categories right"
              className="flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent sm:w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {categories.map(cat => cat.children?.length > 0 && openCategoryId === cat.id && <div key={cat.id} id={`category-submenu-${cat.id}`} style={{ left: categoryMenuLeft }} className="absolute top-full z-50 w-[min(20rem,calc(100vw-1rem))] rounded-b-xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{cat.name}</p>
            <div className="max-h-72 overflow-y-auto">{cat.children.map((child: any) => <Link key={child.id} to={`/category/${child.slug}`} onClick={() => setOpenCategoryId(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-primary">{child.name}</Link>)}</div>
            <Link to={`/category/${cat.slug}`} onClick={() => setOpenCategoryId(null)} className="mt-2 block border-t border-slate-100 px-3 pt-3 text-xs font-bold text-brand-primary hover:underline">View all {cat.name}</Link>
          </div>)}
        </nav>
      )}

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
                  <div key={cat.id}>
                    <div className="flex items-center">
                      <Link to={`/category/${cat.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="min-w-0 flex-1 py-2 px-3 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50">{cat.name}</Link>
                      {cat.children?.length > 0 && <button type="button" onClick={() => setExpandedMobileCategoryId(current => current === cat.id ? null : cat.id)} aria-label={`Show ${cat.name} subcategories`} aria-expanded={expandedMobileCategoryId === cat.id} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronDown className={`h-4 w-4 transition-transform ${expandedMobileCategoryId === cat.id ? 'rotate-180' : ''}`} /></button>}
                    </div>
                    {cat.children?.length > 0 && expandedMobileCategoryId === cat.id && <div className="ml-3 border-l border-slate-200 pl-2">{cat.children.map((child: any) => <Link key={child.id} to={`/category/${child.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-primary">{child.name}</Link>)}</div>}
                  </div>
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
