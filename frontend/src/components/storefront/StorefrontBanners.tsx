import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

const temporaryBanners = [
  {
    title: 'A fresh start, picked for you.',
    subtitle: 'Discover new arrivals for every part of your day.',
    buttonText: 'Shop new arrivals',
    linkUrl: '/shop?sort=newest',
    eyebrow: 'JUST IN',
    accent: 'New season, new favourites.',
  },
  {
    title: 'More to love. Less to spend.',
    subtitle: 'Find little extras and everyday deals worth coming back for.',
    buttonText: 'Explore deals',
    linkUrl: '/shop?flashDeal=true',
    eyebrow: 'EVERYDAY VALUE',
    accent: 'Good finds, better prices.',
  },
];

const TemporaryBannerCard = ({ banner }: { banner: typeof temporaryBanners[number] }) => (
  <Link to={banner.linkUrl} className="home-promo-marquee-card group relative flex min-h-64 flex-col overflow-hidden rounded-[24px] p-6 sm:p-8">
    <div className="flex h-full flex-col items-start justify-between gap-9">
      <div>
        <p className="home-promo-eyebrow">{banner.eyebrow}</p>
        <h2 className="mt-4 max-w-sm text-[clamp(1.65rem,3vw,2.2rem)] font-medium leading-[1.08] tracking-[-.055em]">{banner.title} <em>{banner.accent}</em></h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{banner.subtitle}</p>
      </div>
      <span className="home-promo-cta">{banner.buttonText} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
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
