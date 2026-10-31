import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Headphones, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { StorefrontBanners } from '../components/storefront/StorefrontBanners';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';
import { useCartStore } from '../store/useCartStore';

const questions = [
  ['How can I track my order?', 'Sign in and open Account & Orders to see your order status and available tracking updates.'],
  ['Can I pay with Cash on Delivery?', 'Cash on Delivery is available for eligible orders. Check your PIN code on the product page and review the available payment methods at checkout.'],
  ['How much does delivery cost?', 'Shipping is calculated for your cart and shown before you place your order. Orders above ₹499 qualify for free shipping.'],
  ['Need a hand choosing or ordering?', 'Email pick2buy.in@gmail.com with your question or order number. Our team will help you with the next step.'],
];

const shoppingBenefits = [
  [Truck, 'Fast delivery', 'Reliable doorstep delivery across India.'],
  [ShieldCheck, 'Secure payments', 'Your payment details stay protected.'],
  [RotateCcw, 'Easy returns', 'Simple support when something is not right.'],
  [Headphones, 'Helpful support', 'We are here when you need a hand.'],
] as const;

export const HomePage = () => {
  const homePageRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const cart = useCartStore(state => state.cart);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    api.getProducts({ limit: 50 })
      .then((items) => { if (active) setProducts(items.data || []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const loadRecentSearches = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('pick2buy_recent_searches') || '[]');
        setRecentSearches(Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string').slice(0, 6) : []);
      } catch { setRecentSearches([]); }
    };
    loadRecentSearches();
    window.addEventListener('pick2buy-search-history', loadRecentSearches);
    return () => window.removeEventListener('pick2buy-search-history', loadRecentSearches);
  }, []);

  useEffect(() => {
    const revealItems = homePageRef.current?.querySelectorAll<HTMLElement>('.home-scroll-reveal');
    if (!revealItems?.length) return;

    const showAll = () => revealItems.forEach((item) => item.classList.add('is-visible'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px' },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [products.length, cart?.items.length, recentSearches.length]);

  const cartProductIds = new Set(cart?.items.map(item => item.productId) || []);
  const cartProducts = products.filter(product => cartProductIds.has(product.id));
  const cartCategoryIds = new Set(cartProducts.map(product => product.categoryId));
  const cartSeasonCategoryIds = new Set(cartProducts.flatMap(product => (product.seasonTags || []).map((tag: any) => tag.categoryId)));
  const cartSuggestions = products.filter(product => !cartProductIds.has(product.id) && (
    cartCategoryIds.has(product.categoryId) || (product.seasonTags || []).some((tag: any) => cartSeasonCategoryIds.has(tag.categoryId))
  )).slice(0, 4);
  const searchTerm = recentSearches[0] || '';
  const searchSuggestions = searchTerm ? products.filter(product => `${product.name} ${product.description} ${product.category?.name || ''} ${(product.seasonTags || []).map((tag: any) => tag.category?.name || '').join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4) : [];
  const contextualProducts = cart?.items.length ? (cartSuggestions.length ? cartSuggestions : products.filter(product => !cartProductIds.has(product.id)).slice(0, 4)) : searchSuggestions;
  const contextualSection = contextualProducts.length ? {
    title: cart?.items.length ? 'Suggested ' : 'Still looking for ',
    accent: cart?.items.length ? 'for you.' : `“${searchTerm}”?`,
    link: cart?.items.length ? '/shop' : `/search?q=${encodeURIComponent(searchTerm)}`,
    products: contextualProducts,
    label: cart?.items.length ? 'BASED ON YOUR CART' : 'RECENTLY SEARCHED',
  } : null;
  const sections = [
    { key: 'trending', title: 'Trending ', accent: 'now.', label: 'POPULAR RIGHT NOW', link: '/shop?trending=true', products: products.filter(product => product.isTrending).slice(0, 4) },
    // Flash deals have their own section. Keep regular catalogue products in
    // New arrivals so a new offer does not replace the products shown here.
    { key: 'new-arrivals', title: 'Just in. ', accent: 'New arrivals.', label: '', link: '/shop?sort=newest', products: products.filter(product => !product.isFlashDeal).slice(0, 4) },
    { key: 'best-offers', title: 'Best ', accent: 'offers.', label: 'SAVE MORE TODAY', link: '/shop?flashDeal=true', products: products.filter(product => product.isFlashDeal).slice(0, 4) },
  ];
  const renderSection = (section: { key: string; title: string; accent: string; label: string; link: string; products: any[] }, className = '') => <section key={section.key} className={`page-width home-section home-product-section home-scroll-reveal ${className}`}>
    <div className="section-heading"><div><h2>{section.title}<em>{section.accent}</em></h2></div><Link to={section.link} className="text-link">View collection <ArrowRight size={16} /></Link></div>
    <div className="home-product-grid">{loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />) : section.products.map((product, index) => <ProductCard key={product.id} product={product} priority={section.key === 'trending' && index < 4} />)}</div>
    {!loading && !error && !section.products.length && <p className="catalog-message">Products are on their way. <Link to={section.link}>Explore the full collection →</Link></p>}
  </section>;
  return <div ref={homePageRef} className="home-page">
    <section className="page-width home-section home-section--seasonal home-scroll-reveal">
      <Link to="/category/diwali" className="seasonal-banner" aria-label="Shop Diwali collection">
        <span className="seasonal-banner__lights" aria-hidden="true" />
        <span className="seasonal-banner__diya seasonal-banner__diya--left" aria-hidden="true"><Flame /></span>
        <span className="seasonal-banner__diya seasonal-banner__diya--right" aria-hidden="true"><Flame /></span>
        <div className="seasonal-banner__badge"><Sparkles size={23} /><strong>BIG<br />DIWALI<br />SALE</strong></div>
        <div className="seasonal-banner__copy"><span>FESTIVE PICKS, BETTER PRICES</span><h2>Celebrate Diwali with<br /><em>extra savings.</em></h2><p>Discover festive essentials, gifts and everyday favourites at special prices.</p></div>
      </Link>
    </section>
    {renderSection(sections[0], 'home-section--first')}
    <section className="home-banner-section home-scroll-reveal">
      <div className="page-width home-banner-section__heading section-heading"><div><h2>Everyday Essentials.</h2></div></div>
      <StorefrontBanners />
    </section>
    {contextualSection && renderSection({ ...contextualSection, key: 'contextual' }, 'personalized-section')}
    {renderSection(sections[1])}
    {renderSection(sections[2])}
    <section className="page-width home-section benefits-section home-scroll-reveal">
      <div className="benefits-section__heading"><span className="eyebrow">SHOP WITH CONFIDENCE</span><h2>Small details.<br /><em>Better shopping.</em></h2></div>
      <div className="benefits-grid">{shoppingBenefits.map(([Icon, title, description]) => <div className="benefit-card" key={title}><span className="benefit-card__icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
    </section>
    <section className="page-width home-section faq-section home-scroll-reveal"><div><span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span><h2>Good questions.<br /><em>Simple answers.</em></h2><a className="text-link" href="mailto:pick2buy.in@gmail.com">Talk to our team <ArrowRight size={16} /></a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </div>;
};
