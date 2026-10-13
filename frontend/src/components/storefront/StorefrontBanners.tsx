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
    picks: [{ label: 'Fashion favourites', Icon: Shirt }, { label: 'Home refresh', Icon: Home }, { label: 'Beauty picks', Icon: Sparkles }],
  },
  {
    title: 'More to love. Less to spend.',
    subtitle: 'Find little extras and everyday deals worth coming back for.',
    buttonText: 'Explore deals',
    linkUrl: '/shop?flashDeal=true',
    eyebrow: 'EVERYDAY VALUE',
    accent: 'Good finds, better prices.',
    picks: [{ label: 'Flash deals', Icon: BadgePercent }, { label: 'Trending finds', Icon: Gem }, { label: 'New price drops', Icon: Sparkles }],
  },
];

const TemporaryBannerCard = ({ banner }: { banner: typeof temporaryBanners[number] }) => (
  <Link to={banner.linkUrl} className="home-promo-feature-card group">
    <div className="home-promo-copy">
      <div>
        <p className="home-promo-eyebrow">{banner.eyebrow}</p>
        <h2>{banner.title} <em>{banner.accent}</em></h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{banner.subtitle}</p>
      </div>
      <span className="home-promo-cta">{banner.buttonText} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
    </div>
    <div className="home-promo-stack">
      {banner.picks.map(({ label, Icon }: { label: string; Icon: LucideIcon }) => <div key={label} className="home-promo-mini-card"><Icon aria-hidden="true" /><span>{label}</span></div>)}
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
