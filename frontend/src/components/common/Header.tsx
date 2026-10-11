import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
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
  Zap, 
  LogOut,
  LayoutDashboard,
  Baby,
  BookOpen,
  CarFront,
  Dumbbell,
  Flower2,
  Gem,
  Home,
  Laptop,
  Layers3,
  Music2,
  NotebookPen,
  PawPrint,
  PersonStanding,
  Shapes,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Watch
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { api } from '../../services/api';
import { Avatar } from './Avatar';

type CategoryIcon = { icon: LucideIcon; tint: string; ink: string };

const categoryIcons: Record<string, CategoryIcon> = {
  'kurti-saree-and-lehenga': { icon: Layers3, tint: '#f7e9e5', ink: '#a34d51' },
  'women-western': { icon: Shirt, tint: '#eee9f8', ink: '#6a55a0' },
  lingerie: { icon: Flower2, tint: '#f8eaf0', ink: '#a34b76' },
  men: { icon: PersonStanding, tint: '#e8eef8', ink: '#365a9a' },
  'kids-and-toys': { icon: Baby, tint: '#fff0db', ink: '#a66a1f' },
  'home-and-kitchen': { icon: Home, tint: '#e9f4ee', ink: '#3b7658' },
  'beauty-and-health': { icon: Sparkles, tint: '#f7e9ed', ink: '#a04f6e' },
  'jewellery-and-accessories': { icon: Gem, tint: '#f5ecde', ink: '#99703c' },
  'bags-and-footwear': { icon: ShoppingBag, tint: '#efeae5', ink: '#806044' },
  electronics: { icon: Laptop, tint: '#e7eff8', ink: '#356d9c' },
  watches: { icon: Watch, tint: '#edeef1', ink: '#4f6078' },
  'sports-and-fitness': { icon: Dumbbell, tint: '#e8f3eb', ink: '#387a5e' },
  'car-and-motorbike': { icon: CarFront, tint: '#e9edf3', ink: '#506486' },
  'office-supplies-and-stationery': { icon: NotebookPen, tint: '#f3edf8', ink: '#725394' },
  grocery: { icon: ShoppingBasket, tint: '#edf4e6', ink: '#5e7e35' },
  books: { icon: BookOpen, tint: '#f4eee6', ink: '#8d6543' },
  'pet-supplies': { icon: PawPrint, tint: '#f7ede5', ink: '#a36a42' },
  'musical-instruments': { icon: Music2, tint: '#e9edf8', ink: '#5664a0' },
};
const fallbackCategoryIcon: CategoryIcon = { icon: Shapes, tint: '#eaf0f8', ink: '#345b91' };

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
  const [isCategoryNavCondensed, setIsCategoryNavCondensed] = useState(false);
  const isCategoryNavCondensedRef = useRef(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
    api.getCategories().then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const updateCategoryNav = () => {
      // Keep separate enter/exit points so the navigation height transition
      // cannot push the document back across a single threshold and flicker.
      const shouldCondense = isCategoryNavCondensedRef.current
        ? window.scrollY > 64
        : window.scrollY > 128;
      if (shouldCondense === isCategoryNavCondensedRef.current) return;
      isCategoryNavCondensedRef.current = shouldCondense;
      setIsCategoryNavCondensed(shouldCondense);
    };
    updateCategoryNav();
    window.addEventListener('scroll', updateCategoryNav, { passive: true });
    return () => window.removeEventListener('scroll', updateCategoryNav);
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
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 text-brand-primary font-bold text-xs flex items-center justify-center border border-indigo-200">
                    <Avatar src={user.avatarUrl} name={user.name} alt="Your profile" className="w-full h-full object-cover" />
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

      {!isAuthPage && categories.length > 0 && (
        <nav ref={categoryNavRef} aria-label="Shop categories" onMouseLeave={() => setOpenCategoryId(null)} className={`category-navigation relative border-t border-slate-200 bg-white transition-[height] duration-300 ${isCategoryNavCondensed ? 'category-navigation--compact' : ''}`}>
          <div className="mx-auto max-w-[1600px]">
            <div className={`category-navigation-rail ${isCategoryNavCondensed ? 'category-navigation-rail--compact' : ''}`}>
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              disabled={!categoryScroll.left}
              aria-label="Scroll categories left"
              className="category-navigation-arrow category-navigation-arrow--left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div ref={categoryStripRef} className={`category-strip-scroll category-navigation-scroll ${isCategoryNavCondensed ? 'category-navigation-scroll--compact' : ''}`}>
              <Link to="/shop?sort=bestseller" className={isCategoryNavCondensed ? 'category-navigation-label' : 'category-navigation-item'} aria-label="Popular products">
                <span className="category-navigation-icon" style={{ color: '#8b6b00' }}><Sparkles className="h-6 w-6" /></span>
                <span>{isCategoryNavCondensed ? 'Popular' : 'For you'}</span>
              </Link>
              {categories.map((cat) => {
                const visual = categoryIcons[cat.slug] || fallbackCategoryIcon;
                const Icon = visual.icon;
                return <div key={cat.id} className={`category-navigation-entry ${isCategoryNavCondensed ? 'category-navigation-entry--compact' : ''}`}>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={() => setOpenCategoryId(null)}
                    aria-current={pathname === `/category/${cat.slug}` ? 'page' : undefined}
                    className={isCategoryNavCondensed ? 'category-navigation-label' : 'category-navigation-item'}
                  >
                    <span className="category-navigation-icon" style={{ color: visual.ink }}>
                      {cat.imageUrl ? <img src={cat.imageUrl} alt="" /> : <Icon className="h-6 w-6" strokeWidth={1.8} />}
                    </span>
                    <span>{cat.name}</span>
                  </Link>
                  {isCategoryNavCondensed && cat.children?.length > 0 && <button
                    type="button"
                    aria-label={`Show ${cat.name} subcategories`}
                    aria-expanded={openCategoryId === cat.id}
                    aria-controls={`category-submenu-${cat.id}`}
                    onClick={event => toggleCategoryDropdown(cat.id, event.currentTarget)}
                    className="category-navigation-submenu"
                  ><ChevronDown className={`h-3.5 w-3.5 transition-transform ${openCategoryId === cat.id ? 'rotate-180' : ''}`} /></button>}
                </div>;
              })}
            </div>
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              disabled={!categoryScroll.right}
              aria-label="Scroll categories right"
              className="category-navigation-arrow category-navigation-arrow--right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          </div>
          {isCategoryNavCondensed && categories.map(cat => cat.children?.length > 0 && openCategoryId === cat.id && <div key={cat.id} id={`category-submenu-${cat.id}`} style={{ left: categoryMenuLeft }} className="absolute top-full z-50 w-[min(20rem,calc(100vw-1rem))] rounded-b-xl border border-slate-200 bg-white p-3 shadow-xl">
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
