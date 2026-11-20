import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StorefrontBanners } from '../components/storefront/StorefrontBanners';
import { ProductCampaignBanners } from '../components/storefront/ProductCampaignBanners';
import { SeasonalHeroBanner } from '../components/storefront/SeasonalHeroBanner';
import { ShopByBudget } from '../components/storefront/ShopByBudget';
import { BrandMarquee } from '../components/storefront/BrandMarquee';
import { HomeCategories } from '../components/storefront/HomeCategories';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';
import { useCartStore } from '../store/useCartStore';

const questions = [
  ['How can I track my order?', 'Sign in and open Account & Orders to see your order status and available tracking updates.'],
  ['Can I pay with Cash on Delivery?', 'Cash on Delivery is available for eligible orders. Check your PIN code on the product page and review the available payment methods at checkout.'],
  ['How much does delivery cost?', 'Shipping is calculated for your cart and shown before you place your order. Orders above ₹499 qualify for free shipping.'],
  ['Need a hand choosing or ordering?', 'Email pick2buy.in@gmail.com with your question or order number. Our team will help you with the next step.'],
];

export const HomePage = () => {
  const homePageRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);
  const cart = useCartStore(state => state.cart);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    // The home page renders a handful of products per section. Fetching the
    // full catalogue here delayed first paint and caused unnecessary image
    // work; the Shop page remains the place for full pagination.
    api.getProducts({ limit: 20 })
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
    <SeasonalHeroBanner />
    {renderSection(sections[0], 'home-section--first')}
    <ProductCampaignBanners products={products} />
    <section className="home-banner-section home-scroll-reveal">
      <div className="page-width home-banner-section__heading section-heading"><div><h2>Everyday Essentials.</h2></div></div>
      <StorefrontBanners />
    </section>
    {contextualSection && renderSection({ ...contextualSection, key: 'contextual' }, 'personalized-section')}
    {renderSection(sections[1])}
    <HomeCategories />
    {renderSection(sections[2])}
    <BrandMarquee />
    <ShopByBudget />
    <section className="page-width home-section faq-section home-scroll-reveal" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
      <div className="faq-list">{questions.map(([question, answer], index) => {
        const isOpen = openQuestions.includes(index);
        return <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={question}>
          <h3><button type="button" id={`faq-question-${index}`} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenQuestions(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])}>
            {question}<span aria-hidden="true">+</span>
          </button></h3>
          <div className="faq-answer" id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} aria-hidden={!isOpen}><div><p>{answer}</p></div></div>
        </div>;
      })}</div>
    </section>
  </div>;
};
