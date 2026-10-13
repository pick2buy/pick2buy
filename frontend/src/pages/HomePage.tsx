import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { HeroBanner } from '../components/storefront/HeroBanner';
import { StorefrontBanners } from '../components/storefront/StorefrontBanners';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';

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
  }, []);

  const sections = [
    { title: 'Good finds. ', accent: 'Great favourites.', label: 'THE TRENDING EDIT', link: '/shop?trending=true', products: products.filter(p => p.isTrending).slice(0, 4), promo: { eyebrow: 'TRENDING NOW', title: 'The looks everyone is loving.', link: '/shop?trending=true' } },
    { title: 'More to love. ', accent: 'Less to spend.', label: 'PICKS WITH A LITTLE EXTRA VALUE', link: '/shop?flashDeal=true', products: products.filter(p => p.isFlashDeal).slice(0, 4), promo: { eyebrow: 'LIMITED-TIME PICKS', title: 'A little extra value in every basket.', link: '/shop?flashDeal=true' } },
    { title: 'Meet the ', accent: 'best sellers.', label: 'EXPLORE THE COLLECTION', link: '/shop?sort=bestseller', products: products.filter(p => p.isBestSeller).slice(0, 4), promo: { eyebrow: 'PICK2BUY FAVOURITES', title: 'Made popular by shoppers like you.', link: '/shop?sort=bestseller' } },
  ];
  return <div ref={homePageRef} className="home-page">
    <HeroBanner products={(products.filter(product => product.stock > 0).length ? products.filter(product => product.stock > 0) : products).slice(0, 2)} />
    <div className="service-strip page-width home-scroll-reveal">
      {[[Truck, 'Delivery across India'], [CreditCard, 'Cash on Delivery'], [ShieldCheck, 'Secure checkout']].map(([Icon, text]: any) => <div key={text}><Icon size={20} /><span>{text}</span></div>)}
    </div>
    <div className="home-scroll-reveal"><StorefrontBanners /></div>
    {sections.map((section, index) => <section key={section.label} className={`page-width home-section home-scroll-reveal ${index === 1 ? 'value-section' : ''}`}>
      <div className="section-heading"><div><span className="eyebrow">{section.label}</span><h2>{section.title}<em>{section.accent}</em></h2></div><Link to={section.link} className="text-link">View collection <ArrowRight size={16} /></Link></div>
      <div className="home-product-grid">{loading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />) : section.products.map(product => <ProductCard key={product.id} product={product} />)}</div>
      {!loading && !error && !section.products.length && <p className="catalog-message">New picks are on their way. <Link to="/shop">Explore the full collection →</Link></p>}
      <Link to={section.promo.link} className="home-section-promo group mt-5 flex min-h-28 items-center justify-between gap-5 rounded-[22px] px-5 py-5 sm:px-7">
        <div><p className="home-promo-eyebrow">{section.promo.eyebrow}</p><p className="mt-2 text-lg font-medium tracking-[-.035em] sm:text-xl">{section.promo.title}</p></div>
        <span className="home-section-promo-cta">Shop now <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
      </Link>
    </section>)}
    <section className="page-width home-section home-scroll-reveal"><div className="discovery-banner"><span className="eyebrow">LESS SEARCHING. MORE DISCOVERING.</span><h2>A fresh pick for<br /><em>every part of your day.</em></h2><p>From the first song of the morning to the comforts of home.<br />Make room for something you'll love.</p><Link to="/shop?sort=newest" className="primary-pill">Discover what's new <ArrowRight size={17} /></Link></div></section>
    <section className="page-width home-section faq-section home-scroll-reveal"><div><span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span><h2>Good questions.<br /><em>Simple answers.</em></h2><a className="text-link" href="mailto:pick2buy.in@gmail.com">Talk to our team <ArrowRight size={16} /></a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </div>;
};
