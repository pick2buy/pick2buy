import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

type Banner = { id: string; title: string; subtitle?: string | null; desktopImageUrl: string; mobileImageUrl?: string | null; buttonText?: string | null; linkUrl: string; hideCopy?: boolean };

const fallbackBanners: Banner[] = [
  { id: 'riding-jacket', title: 'Men Riding Jacket', desktopImageUrl: '/banners/riding-jacket.png', buttonText: 'Shop riding jackets', linkUrl: '/shop?search=riding%20jacket', hideCopy: true },
  { id: 'wooden-money-piggi', title: '1 Lakh Wooden Money Piggi', desktopImageUrl: '/banners/wooden-money-piggi.png', buttonText: 'Shop savings gifts', linkUrl: '/shop?search=wooden%20money%20piggi', hideCopy: true },
  { id: 'gym-hoodie', title: 'Gym Hoodie T-Shirt', desktopImageUrl: '/banners/gym-hoodie.png', buttonText: 'Shop gym hoodies', linkUrl: '/shop?search=gym%20hoodie', hideCopy: true },
];

const BannerContent = ({ banner }: { banner: Banner }) => <><picture><source media="(max-width: 639px)" srcSet={banner.mobileImageUrl || banner.desktopImageUrl} /><img src={banner.desktopImageUrl} alt={banner.title} /></picture><div className={`storefront-banner-copy ${banner.hideCopy ? 'storefront-banner-copy--minimal' : ''}`}>{!banner.hideCopy && <><p className="storefront-banner-eyebrow">Pick2Buy exclusive</p><h2>{banner.title}</h2>{banner.subtitle && <p>{banner.subtitle}</p>}</>}<span className="storefront-banner-cta">{banner.buttonText || 'Shop now'} <ArrowRight size={17} /></span></div></>;

const BannerLink = ({ banner, className }: { banner: Banner; className: string }) => banner.linkUrl.startsWith('/') ? <Link to={banner.linkUrl} className={className}><BannerContent banner={banner} /></Link> : <a href={banner.linkUrl} className={className}><BannerContent banner={banner} /></a>;

export const StorefrontBanners = () => {
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [activeIndex, setActiveIndex] = useState(0);
  const displayedBanners = banners;

  useEffect(() => { let active = true; api.getActiveBanners().then(response => { if (active && response.data?.length) setBanners(response.data); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => { setActiveIndex(current => Math.min(current, displayedBanners.length - 1)); }, [displayedBanners.length]);
  useEffect(() => { if (displayedBanners.length < 2) return; const interval = window.setInterval(() => setActiveIndex(current => (current + 1) % displayedBanners.length), 6000); return () => window.clearInterval(interval); }, [displayedBanners.length]);
  const goTo = (index: number) => setActiveIndex((index + displayedBanners.length) % displayedBanners.length);

  return <section aria-label="Featured promotions" className="storefront-banner-shell">
    <div className="storefront-banner-desktop">{displayedBanners.map(banner => <BannerLink key={banner.id} banner={banner} className="storefront-banner-card group" />)}</div>
    <div className="storefront-banner-mobile"><div className="storefront-banner-viewport"><div className="storefront-banner-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>{displayedBanners.map(banner => <BannerLink key={banner.id} banner={banner} className="storefront-banner-slide group" />)}</div>{displayedBanners.length > 1 && <><button type="button" onClick={() => goTo(activeIndex - 1)} className="storefront-banner-arrow storefront-banner-arrow--previous" aria-label="Previous banner"><ArrowLeft size={19} /></button><button type="button" onClick={() => goTo(activeIndex + 1)} className="storefront-banner-arrow storefront-banner-arrow--next" aria-label="Next banner"><ArrowRight size={19} /></button><div className="storefront-banner-dots" role="tablist" aria-label="Banner slides">{displayedBanners.map((banner, index) => <button type="button" key={banner.id} onClick={() => goTo(index)} className={index === activeIndex ? 'is-active' : ''} aria-label={`Show ${banner.title}`} aria-selected={index === activeIndex} role="tab" />)}</div></>}</div></div>
  </section>;
};
