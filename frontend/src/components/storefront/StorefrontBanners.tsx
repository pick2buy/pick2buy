import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const StorefrontBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    api.getActiveBanners().then(response => { if (active) setBanners(response.data || []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!banners.length) return null;

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
