import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Gem, Home, Shirt, Sparkles, type LucideIcon } from 'lucide-react';
import { api } from '../../services/api';

const temporaryBanners = [
  {
    title: 'A fresh start, picked for you.',
    subtitle: 'Discover new arrivals for every part of your day.',
    buttonText: 'Shop new arrivals',
    linkUrl: '/shop?sort=newest',
    eyebrow: 'JUST IN',
    accent: 'New season, new favourites.',
    style: 'new',
    picks: [
      { label: 'Fashion favourites', caption: 'New style', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=280&q=85', Icon: Shirt },
      { label: 'Home refresh', caption: 'Fresh spaces', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=280&q=85', Icon: Home },
      { label: 'Beauty picks', caption: 'Just arrived', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=280&q=85', Icon: Sparkles },
    ],
  },
  {
    title: 'More to love. Less to spend.',
    subtitle: 'Find little extras and everyday deals worth coming back for.',
    buttonText: 'Explore deals',
    linkUrl: '/shop?flashDeal=true',
    eyebrow: 'EVERYDAY VALUE',
    accent: 'Good finds, better prices.',
    style: 'value',
    picks: [
      { label: 'Flash deals', caption: 'Ends soon', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=280&q=85', Icon: BadgePercent },
      { label: 'Trending finds', caption: 'Popular now', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=280&q=85', Icon: Gem },
      { label: 'New price drops', caption: 'Save today', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=280&q=85', Icon: Sparkles },
    ],
  },
  {
    title: 'Your next favourite is waiting.',
    subtitle: 'Browse popular picks across tech, style, home and everyday essentials.',
    buttonText: 'Shop best sellers',
    linkUrl: '/shop?sort=popular',
    eyebrow: 'MOST LOVED',
    accent: 'Picked by shoppers.',
    style: 'bestsellers',
    picks: [
      { label: 'Popular electronics', caption: 'Smart picks', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=280&q=85', Icon: Sparkles },
      { label: 'Top rated fashion', caption: 'New looks', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=280&q=85', Icon: Shirt },
      { label: 'Customer favourites', caption: 'Top rated', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=280&q=85', Icon: Gem },
    ],
  },
  {
    title: 'Weekend prices are here.',
    subtitle: 'Save on useful finds with limited-time offers across the store.',
    buttonText: 'See special offers',
    linkUrl: '/shop?flashDeal=true',
    eyebrow: 'LIMITED TIME',
    accent: 'More value in every cart.',
    style: 'weekend',
    picks: [
      { label: 'Up to 50% off', caption: 'Selected items', image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=280&q=85', Icon: BadgePercent },
      { label: 'Extra checkout savings', caption: 'Use WELCOME10', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=280&q=85', Icon: Sparkles },
      { label: 'Fast delivery picks', caption: 'Delivered quickly', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=280&q=85', Icon: Home },
    ],
  },
];

const TemporaryBannerCard = ({ banner }: { banner: typeof temporaryBanners[number] }) => (
  <Link to={banner.linkUrl} className={`home-promo-feature-card home-promo-feature-card--${banner.style} group`}>
    <div className="home-promo-copy">
      <div>
        <p className="home-promo-eyebrow">{banner.eyebrow}</p>
        <h2>{banner.title} <em>{banner.accent}</em></h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{banner.subtitle}</p>
      </div>
      <span className="home-promo-cta">{banner.buttonText} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
    </div>
    <div className="home-promo-stack">
      {banner.picks.map(({ label, caption, image, Icon }: { label: string; caption?: string; image?: string; Icon: LucideIcon }) => <div key={label} className={`home-promo-mini-card ${image ? 'home-promo-mini-card--visual' : ''}`}>
        {image ? <img src={image} alt="" /> : <Icon aria-hidden="true" />}
        <span><strong>{label}</strong>{caption && <small>{caption}</small>}</span>
        {image && <ArrowRight className="home-promo-mini-arrow" aria-hidden="true" />}
      </div>)}
    </div>
  </Link>
);

export const StorefrontBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    api.getActiveBanners().then(response => { if (active) setBanners(response.data || []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!banners.length) {
    return <section aria-label="Featured promotions" className="page-width overflow-hidden pb-8">
      <div className="home-promo-marquee-track">
        {[...temporaryBanners, ...temporaryBanners].map((banner, index) => <TemporaryBannerCard key={`${banner.title}-${index}`} banner={banner} />)}
      </div>
    </section>;
  }

  return <section aria-label="Featured promotions" className="page-width grid gap-5 pb-8 md:grid-cols-2">
    {banners.map(banner => {
      const content = <>
        <picture className="block overflow-hidden"><source media="(max-width: 639px)" srcSet={banner.mobileImageUrl || banner.desktopImageUrl} /><img src={banner.desktopImageUrl} alt={banner.title} className="aspect-[2/1] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] md:aspect-[16/9]" /></picture>
        <div className="flex items-center justify-between gap-3 p-5"><div><h2 className="text-lg font-black text-slate-900">{banner.title}</h2>{banner.subtitle && <p className="mt-1 text-sm text-slate-600">{banner.subtitle}</p>}</div><span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-primary">{banner.buttonText || 'Explore'} <ArrowRight size={16} /></span></div>
      </>;
      const className = 'group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md';
      return banner.linkUrl.startsWith('/')
        ? <Link key={banner.id} to={banner.linkUrl} className={className}>{content}</Link>
        : <a key={banner.id} href={banner.linkUrl} className={className}>{content}</a>;
    })}
  </section>;
};
