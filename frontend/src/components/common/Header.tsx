import { useModal } from '../../hooks/useModal';
import React, { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowLeft,
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
  fashion: { icon: Shirt, tint: '#f3e8f7', ink: '#875191' },
  'kurti-saree-and-lehenga': { icon: Layers3, tint: '#f7e9e5', ink: '#a34d51' },
  'women-western': { icon: Shirt, tint: '#eee9f8', ink: '#6a55a0' },
  lingerie: { icon: Flower2, tint: '#f8eaf0', ink: '#a34b76' },
  men: { icon: PersonStanding, tint: '#e8eef8', ink: '#365a9a' },
  'gen-z': { icon: Zap, tint: '#fff0db', ink: '#a66a1f' },
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
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const headerRef = useRef<HTMLElement>(null);
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const categoryNavRef = useRef<HTMLElement>(null);
  const [categoryScroll, setCategoryScroll] = useState({ left: false, right: false });
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [categoryMenuLeft, setCategoryMenuLeft] = useState(8);
  const [expandedMobileCategoryId, setExpandedMobileCategoryId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const isProductDetailPage = pathname.startsWith('/product/');
  const [isCategoryNavCondensed, setIsCategoryNavCondensed] = useState(isProductDetailPage);
  const isCategoryNavCondensedRef = useRef(isProductDetailPage);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
    api.getCategories().then((res) => {
      setCategories((res.data || []).filter((category: any) => category.isVisible !== false).map((category: any) => ({
        ...category,
        children: category.children?.filter((child: any) => child.isVisible !== false),
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const request = window.setTimeout(() => {
      api.getProducts({ q: query, limit: 6 })
        .then((response) => { if (active) setSearchSuggestions(response.data || []); })
        .catch(() => { if (active) setSearchSuggestions([]); })
        .finally(() => { if (active) setIsSearching(false); });
    }, 220);

    return () => { active = false; window.clearTimeout(request); };
  }, [searchQuery]);

  useEffect(() => {
    const updateCategoryNav = () => {
      if (isProductDetailPage) {
        if (!isCategoryNavCondensedRef.current) {
          isCategoryNavCondensedRef.current = true;
          setIsCategoryNavCondensed(true);
        }
        return;
      }
      // Keep separate enter/exit points so the header's height transition
      // cannot push the document back across a single threshold and flicker.
      // Mobile gets a wider buffer because it collapses more of the masthead.
      const isMobile = window.matchMedia('(max-width: 639px)').matches;
      const enterAt = isMobile ? 112 : 128;
      // On phones, only restore the full masthead at the actual top. This
      // prevents the changing header height from bouncing across the exit point.
      const exitAt = isMobile ? 2 : 64;
      const shouldCondense = isCategoryNavCondensedRef.current
        ? window.scrollY > exitAt
        : window.scrollY > enterAt;
      if (shouldCondense === isCategoryNavCondensedRef.current) return;
      isCategoryNavCondensedRef.current = shouldCondense;
      setIsCategoryNavCondensed(shouldCondense);
    };
    updateCategoryNav();
    window.addEventListener('scroll', updateCategoryNav, { passive: true });
    return () => window.removeEventListener('scroll', updateCategoryNav);
  }, [isProductDetailPage]);

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
    if (!isCategoryNavCondensed) return;
    const strip = categoryStripRef.current;
    if (!strip) return;
    strip.scrollLeft = 0;
    // iOS Safari can restore the previous horizontal offset after the compact
    // nav changes item widths, so reset once more after that layout is applied.
    const frame = window.requestAnimationFrame(() => { strip.scrollLeft = 0; });
    return () => window.cancelAnimationFrame(frame);
  }, [categories.length, isCategoryNavCondensed]);

  useEffect(() => {
    if (isCategoryNavCondensed && !isProductDetailPage) return;
    const header = headerRef.current;
    if (!header) return;

    const updateMobileHeaderHeight = () => {
      if (!window.matchMedia('(max-width: 639px)').matches) return;
      document.documentElement.style.setProperty(
        isProductDetailPage ? '--product-mobile-header-height' : '--storefront-mobile-header-height',
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    };

    updateMobileHeaderHeight();
    const resizeObserver = new ResizeObserver(updateMobileHeaderHeight);
    resizeObserver.observe(header);
    window.addEventListener('resize', updateMobileHeaderHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMobileHeaderHeight);
    };
  }, [categories.length, isAuthPage, isCategoryNavCondensed, isProductDetailPage]);

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

  const openMobileMenu = () => {
    setIsMobileMenuMounted(true);
    setIsMobileMenuOpen(true);
  };
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  useEffect(() => {
    if (isMobileMenuOpen || !isMobileMenuMounted) return;
    const timeout = window.setTimeout(() => setIsMobileMenuMounted(false), 260);
    return () => window.clearTimeout(timeout);
  }, [isMobileMenuOpen, isMobileMenuMounted]);

  const menuRef = useModal(isMobileMenuOpen, closeMobileMenu);
  // The badge represents distinct products in the bag, not units. Changing a
  // product's quantity should not make the cart icon count jump.
  const totalCartCount = cart?.items.length || 0;

  const rememberSearch = (query: string) => {
      try {
        const previous = JSON.parse(localStorage.getItem('pick2buy_recent_searches') || '[]');
        const searches = [query, ...previous.filter((item: unknown) => typeof item === 'string' && item.toLowerCase() !== query.toLowerCase())].slice(0, 6);
        localStorage.setItem('pick2buy_recent_searches', JSON.stringify(searches));
        window.dispatchEvent(new Event('pick2buy-search-history'));
      } catch { /* Search remains available if browser storage is unavailable. */ }
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      rememberSearch(query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      closeMobileMenu();
    }
  };
  const openProductSuggestion = (product: any) => {
    if (searchQuery.trim()) rememberSearch(searchQuery.trim());
    setSearchQuery('');
    setSearchSuggestions([]);
    setIsSearchFocused(false);
    navigate(`/product/${product.slug || product.id}`);
  };
  const renderSearchSuggestions = () => {
    if (!isSearchFocused || searchQuery.trim().length < 2) return null;
    return <div className="search-suggestions" role="listbox" aria-label="Search suggestions">
      {isSearching && <p className="search-suggestions-status">Searching products…</p>}
      {!isSearching && searchSuggestions.map((product) => {
        const image = product.images?.find((item: any) => item.isPrimary)?.url || product.images?.[0]?.url || product.imageUrl;
        return <button type="button" key={product.id} role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => openProductSuggestion(product)} className="search-suggestion-item">
          <span className="search-suggestion-image">{image ? <img src={image} alt="" /> : <Search size={18} />}</span>
          <span className="min-w-0 text-left"><span className="search-suggestion-name">{product.name}</span><span className="search-suggestion-category">in {product.category?.name || 'Products'}</span></span>
        </button>;
      })}
      {!isSearching && !searchSuggestions.length && <p className="search-suggestions-status">No products found. Press Enter to search all products.</p>}
    </div>;
  };

  return (
    <header ref={headerRef} className={`store-header sticky top-0 z-40 bg-white border-b border-slate-200 ${isCategoryNavCondensed ? 'store-header--scrolled' : ''}`}>
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
              onClick={() => isMobileMenuOpen ? closeMobileMenu() : openMobileMenu()}
              className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="header-brand group" aria-label="Pick2Buy home">
              <img src="/pick2buy-logo.png" alt="Pick2Buy" width="900" height="186" />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                aria-label="Search products" type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                placeholder="Search products, brands, electronics, apparel..."
                className="header-search-input w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm text-slate-800 rounded-full pl-11 pr-24 py-2.5 border border-slate-200 focus:border-slate-200 focus:ring-0 outline-none transition-all placeholder:text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="brand-search-button absolute right-1.5 top-1/2 -translate-y-1/2 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shadow-sm"
              >
                Search
              </button>
              {renderSearchSuggestions()}
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
            <div
              className="relative"
              onMouseEnter={() => user && setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
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
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 hidden xl:inline transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link
                  to="/login" aria-label="Sign in"
                  className="inline-flex min-h-0 items-center justify-center gap-1.5 rounded-full p-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-primary sm:px-3"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* User Dropdown */}
              {user && isUserMenuOpen && (
                <div className="absolute right-0 top-full w-52 bg-white rounded-xl shadow-elevated border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
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
        <div className={`${isAuthPage ? 'hidden' : 'mt-3'} mobile-search-row md:hidden ${isCategoryNavCondensed ? 'mobile-search-row--compact' : ''} ${isProductDetailPage ? 'mobile-search-row--product' : ''}`}>
          {isProductDetailPage && (
            <button
              type="button"
              aria-label="Go back"
              className="mobile-product-header-action hidden"
              onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/shop')}
            >
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              aria-label="Search products" type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
              placeholder="Search products..."
              className="w-full bg-slate-100 text-sm text-slate-800 rounded-full pl-10 pr-20 py-2 border border-slate-200 outline-none"
            />
            <Search className="mobile-search-leading-icon w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              aria-label="Search"
              className="mobile-search-submit brand-search-button absolute right-1 top-1/2 -translate-y-1/2 text-white text-xs font-semibold px-3 py-1 rounded-full"
            >
              <span className="mobile-search-submit-label">Search</span>
              <Search className="mobile-search-submit-icon h-4 w-4" />
            </button>
              {renderSearchSuggestions()}
          </form>
        </div>
      </div>

      {!isAuthPage && categories.length > 0 && (
        <nav ref={categoryNavRef} aria-label="Shop categories" onMouseLeave={() => setOpenCategoryId(null)} className={`category-navigation relative border-t border-slate-200 bg-white transition-[height] duration-300 ${isCategoryNavCondensed ? 'category-navigation--compact' : ''}`}>
          <div className="w-full">
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
              <Link to="/shop?sort=bestseller" className={isCategoryNavCondensed ? 'category-navigation-label' : 'category-navigation-item category-navigation-item--featured'} aria-current={pathname === '/' ? 'page' : undefined} aria-label="Popular products" title="Popular">
                <span className="category-navigation-icon"><Sparkles aria-hidden="true" /></span>
                <span>Popular</span>
              </Link>
              {categories.map((cat) => {
                const visual = categoryIcons[cat.slug] || fallbackCategoryIcon;
                const Icon = visual.icon;
                return <div key={cat.id} className={`category-navigation-entry ${isCategoryNavCondensed ? 'category-navigation-entry--compact' : ''}`}>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={() => setOpenCategoryId(null)}
                    aria-current={pathname === `/category/${cat.slug}` ? 'page' : undefined}
                    title={cat.name}
                    className={isCategoryNavCondensed ? 'category-navigation-label' : 'category-navigation-item'}
                  >
                    <span className="category-navigation-icon"><Icon aria-hidden="true" /></span>
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
      {isMobileMenuMounted && createPortal(
        <div className={`mobile-menu-shell lg:hidden fixed inset-0 z-[60] flex h-screen h-[100dvh] ${isMobileMenuOpen ? 'is-open' : 'is-closing'}`}>
          <div
            className="mobile-menu-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div ref={menuRef} role="dialog" aria-modal="true" aria-label="Navigation" className="mobile-menu-panel relative z-10 flex h-full w-4/5 max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Link to="/" onClick={closeMobileMenu} className="header-brand header-brand--drawer" aria-label="Pick2Buy home">
                <img src="/pick2buy-logo.png" alt="Pick2Buy" width="900" height="186" />
              </Link>
              <button
                onClick={closeMobileMenu}
                aria-label="Close navigation" className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="block py-2.5 px-3 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={closeMobileMenu}
                className="block py-2.5 px-3 text-sm font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
              >
                All Products
              </Link>
              <Link
                to="/shop?flashDeal=true"
                onClick={closeMobileMenu}
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
                      <Link to={`/category/${cat.slug}`} onClick={closeMobileMenu} className="min-w-0 flex-1 py-2 px-3 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50">{cat.name}</Link>
                      {cat.children?.length > 0 && <button type="button" onClick={() => setExpandedMobileCategoryId(current => current === cat.id ? null : cat.id)} aria-label={`Show ${cat.name} subcategories`} aria-expanded={expandedMobileCategoryId === cat.id} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronDown className={`h-4 w-4 transition-transform ${expandedMobileCategoryId === cat.id ? 'rotate-180' : ''}`} /></button>}
                    </div>
                    {cat.children?.length > 0 && expandedMobileCategoryId === cat.id && <div className="ml-3 border-l border-slate-200 pl-2">{cat.children.map((child: any) => <Link key={child.id} to={`/category/${child.slug}`} onClick={closeMobileMenu} className="block rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-primary">{child.name}</Link>)}</div>}
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
                    onClick={closeMobileMenu}
                    className="block w-full text-center bg-slate-100 text-slate-800 py-2 rounded-lg text-xs font-bold mb-2"
                  >
                    Account & Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
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
                    onClick={closeMobileMenu}
                    className="text-center py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
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
