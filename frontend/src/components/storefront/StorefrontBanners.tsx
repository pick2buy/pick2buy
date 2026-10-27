import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

type Banner = { id: string; title: string; subtitle?: string | null; desktopImageUrl: string; mobileImageUrl?: string | null; buttonText?: string | null; linkUrl: string; hideCopy?: boolean };

const fallbackBanners: Banner[] = [
  { id: 'riding-jacket', title: 'Men Riding Jacket', desktopImageUrl: '/banners/riding-jacket.webp', linkUrl: '/product/men-riding-jacket', hideCopy: true },
  { id: 'wooden-money-piggi', title: '1 Lakh Wooden Money Piggi', desktopImageUrl: '/banners/wooden-money-piggi.webp', linkUrl: '/product/1-lakh-wooden-money-piggi', hideCopy: true },
];

const BannerContent = ({ banner, priority = false }: { banner: Banner; priority?: boolean }) => <><picture><source media="(max-width: 639px)" srcSet={banner.mobileImageUrl || banner.desktopImageUrl} /><img src={banner.desktopImageUrl} alt={banner.title} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'low'} decoding="async" /></picture>{!banner.hideCopy && <div className="storefront-banner-copy"><p className="storefront-banner-eyebrow">Pick2Buy exclusive</p><h2>{banner.title}</h2>{banner.subtitle && <p>{banner.subtitle}</p>}</div>}</>;

const BannerLink = ({ banner, className, priority = false }: { banner: Banner; className: string; priority?: boolean }) => banner.linkUrl.startsWith('/') ? <Link to={banner.linkUrl} className={className}><BannerContent banner={banner} priority={priority} /></Link> : <a href={banner.linkUrl} className={className}><BannerContent banner={banner} priority={priority} /></a>;

export const StorefrontBanners = () => {
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [activeIndex, setActiveIndex] = useState(0);
  const displayedBanners = banners;

  useEffect(() => { let active = true; api.getActiveBanners().then(response => { if (active && response.data?.length) setBanners(response.data); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => { setActiveIndex(current => Math.min(current, displayedBanners.length - 1)); }, [displayedBanners.length]);
  useEffect(() => { if (displayedBanners.length < 2) return; const interval = window.setInterval(() => setActiveIndex(current => (current + 1) % displayedBanners.length), 6000); return () => window.clearInterval(interval); }, [displayedBanners.length]);
  const goTo = (index: number) => setActiveIndex((index + displayedBanners.length) % displayedBanners.length);

  return <section aria-label="Featured promotions" className="storefront-banner-shell">
    <div className="storefront-banner-desktop"><div className="storefront-banner-desktop-track" style={{ transform: `translateX(-${activeIndex * (100 / 3)}%)` }}>{[...displayedBanners, ...displayedBanners].map((banner, index) => <BannerLink key={`${banner.id}-${index}`} banner={banner} className="storefront-banner-card group" priority={index < 3} />)}</div></div>
    <div className="storefront-banner-mobile"><div className="storefront-banner-viewport"><div className="storefront-banner-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>{displayedBanners.map((banner, index) => <BannerLink key={banner.id} banner={banner} className="storefront-banner-slide group" priority={index === 0} />)}</div>{displayedBanners.length > 1 && <><button type="button" onClick={() => goTo(activeIndex - 1)} className="storefront-banner-arrow storefront-banner-arrow--previous" aria-label="Previous banner"><ArrowLeft size={19} /></button><button type="button" onClick={() => goTo(activeIndex + 1)} className="storefront-banner-arrow storefront-banner-arrow--next" aria-label="Next banner"><ArrowRight size={19} /></button><div className="storefront-banner-dots" role="tablist" aria-label="Banner slides">{displayedBanners.map((banner, index) => <button type="button" key={banner.id} onClick={() => goTo(index)} className={index === activeIndex ? 'is-active' : ''} aria-label={`Show ${banner.title}`} aria-selected={index === activeIndex} role="tab" />)}</div></>}</div></div>
  </section>;
};
