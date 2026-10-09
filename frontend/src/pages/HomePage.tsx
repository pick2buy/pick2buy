import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Headphones, Shirt, Home, Watch, Footprints, Dumbbell, Sparkles, Package, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { HeroBanner } from '../components/storefront/HeroBanner';
import { StorefrontBanners } from '../components/storefront/StorefrontBanners';
import { ProductCard } from '../components/common/ProductCard';
import { api } from '../services/api';

const categoryIcons = [Headphones, Watch, Shirt, Footprints, Home, Dumbbell, Sparkles, Package];
const questions = [
  ['How can I track my order?', 'Sign in and open Account & Orders to see your order status and available tracking updates.'],
  ['Can I pay with Cash on Delivery?', 'Cash on Delivery is available for eligible orders. Check your PIN code on the product page and review the available payment methods at checkout.'],
  ['How much does delivery cost?', 'Shipping is calculated for your cart and shown before you place your order. Orders above ₹499 qualify for free shipping.'],
  ['Need a hand choosing or ordering?', 'Email pick2buy.in@gmail.com with your question or order number. Our team will help you with the next step.'],
];

export const HomePage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    Promise.all([api.getCategories(), api.getProducts({ limit: 50 })])
      .then(([cats, items]) => { if (active) { setCategories(cats.data || []); setProducts(items.data || []); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const sections = [
    { title: 'Good finds. ', accent: 'Great favourites.', label: 'THE TRENDING EDIT', link: '/shop?trending=true', products: products.filter(p => p.isTrending).slice(0, 4) },
    { title: 'More to love. ', accent: 'Less to spend.', label: 'PICKS WITH A LITTLE EXTRA VALUE', link: '/shop?flashDeal=true', products: products.filter(p => p.isFlashDeal).slice(0, 4) },
    { title: 'Meet the ', accent: 'best sellers.', label: 'EXPLORE THE COLLECTION', link: '/shop?sort=bestseller', products: products.filter(p => p.isBestSeller).slice(0, 4) },
  ];
  return <div className="home-page">
    <HeroBanner />
    <StorefrontBanners />
    <div className="service-strip page-width">
      {[[Truck, 'Delivery across India'], [CreditCard, 'Cash on Delivery'], [ShieldCheck, 'Secure checkout']].map(([Icon, text]: any) => <div key={text}><Icon size={20} /><span>{text}</span></div>)}
    </div>
    <section className="page-width home-section" id="collections">
      <div className="section-heading"><div><span className="eyebrow">A WORLD OF EVERYDAY POSSIBILITIES</span><h2>Find your <em>kind of thing.</em></h2></div><Link className="text-link" to="/shop">Shop everything <ArrowRight size={16} /></Link></div>
      {error ? <div role="alert" className="catalog-message"><h3>We couldn't load the collection.</h3><p>Check your connection and try again.</p><button className="primary-pill" onClick={() => setAttempt(n => n + 1)}>Try again</button></div> :
        <div className="category-tiles">{loading ? Array.from({ length: 8 }, (_, i) => <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />) : categories.map((cat, i) => { const Icon = categoryIcons[i % categoryIcons.length]; return <Link key={cat.id} to={`/category/${cat.slug}`}><span className="category-icon"><Icon size={28} strokeWidth={1.4} /></span><strong>{cat.name}</strong><span className="category-explore">Explore <ArrowRight size={12} /></span></Link>; })}</div>}
    </section>
    {sections.map((section, index) => <section key={section.label} className={`page-width home-section ${index === 1 ? 'value-section' : ''}`}>
      <div className="section-heading"><div><span className="eyebrow">{section.label}</span><h2>{section.title}<em>{section.accent}</em></h2></div><Link to={section.link} className="text-link">View collection <ArrowRight size={16} /></Link></div>
      <div className="home-product-grid">{loading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />) : section.products.map(product => <ProductCard key={product.id} product={product} />)}</div>
      {!loading && !error && !section.products.length && <p className="catalog-message">New picks are on their way. <Link to="/shop">Explore the full collection →</Link></p>}
    </section>)}
    <section className="page-width home-section"><div className="discovery-banner"><span className="eyebrow">LESS SEARCHING. MORE DISCOVERING.</span><h2>A fresh pick for<br /><em>every part of your day.</em></h2><p>From the first song of the morning to the comforts of home.<br />Make room for something you'll love.</p><Link to="/shop?sort=newest" className="primary-pill">Discover what's new <ArrowRight size={17} /></Link></div></section>
    <section className="page-width home-section faq-section"><div><span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span><h2>Good questions.<br /><em>Simple answers.</em></h2><a className="text-link" href="mailto:pick2buy.in@gmail.com">Talk to our team <ArrowRight size={16} /></a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </div>;
};
