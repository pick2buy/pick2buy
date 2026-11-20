import { useEffect, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StorefrontBanner, useStorefrontBanners } from '../../hooks/useStorefrontBanners';

const ManagedBanner = ({ banner, priority }: { banner: StorefrontBanner; priority: boolean }) => {
  const content = <picture>
    <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl || banner.desktopImageUrl} />
    <img src={banner.desktopImageUrl} alt={banner.title || 'Pick2Buy promotion'} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'low'} decoding="async" />
  </picture>;
  const className = 'seasonal-banner seasonal-banner--managed';
  return banner.linkUrl.startsWith('/')
    ? <Link to={banner.linkUrl} className={className} aria-label={banner.title || 'Open promotion'}>{content}</Link>
    : <a href={banner.linkUrl} className={className} aria-label={banner.title || 'Open promotion'}>{content}</a>;
};

export const SeasonalHeroBanner = () => {
  const banners = useStorefrontBanners('HERO');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!banners?.length) return;
    setActiveIndex(current => Math.min(current, banners.length - 1));
    if (banners.length < 2) return;
    const interval = window.setInterval(() => setActiveIndex(current => (current + 1) % banners.length), 7000);
    return () => window.clearInterval(interval);
  }, [banners?.length]);

  if (banners?.length) return <section className="page-width home-section home-section--seasonal home-scroll-reveal">
    <div className="seasonal-banner-carousel">
      <div className="seasonal-banner-carousel__track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {banners.map((banner, index) => <div className="seasonal-banner-carousel__slide" key={banner.id}><ManagedBanner banner={banner} priority={index === 0} /></div>)}
      </div>
      {banners.length > 1 && <div className="seasonal-banner-carousel__dots" role="tablist" aria-label="Main promotional banners">
        {banners.map((banner, index) => <button type="button" key={banner.id} onClick={() => setActiveIndex(index)} className={index === activeIndex ? 'is-active' : ''} aria-label={`Show ${banner.title || `banner ${index + 1}`}`} aria-selected={index === activeIndex} role="tab" />)}
      </div>}
    </div>
  </section>;

  return <section className="page-width home-section home-section--seasonal home-scroll-reveal">
    <Link to="/search?q=winter" className="seasonal-banner" aria-label="Shop winter collection">
      <span className="seasonal-banner__lights" aria-hidden="true" />
      <span className="seasonal-banner__diya seasonal-banner__diya--left" aria-hidden="true"><Flame /></span>
      <span className="seasonal-banner__diya seasonal-banner__diya--right" aria-hidden="true"><Flame /></span>
      <div className="seasonal-banner__badge"><Sparkles size={23} /><strong>BIG<br />WINTER<br />SALE</strong></div>
      <div className="seasonal-banner__copy"><span>WINTER PICKS, BETTER PRICES</span><h2>Warm up winter with<br /><em>extra savings.</em></h2><p>Discover cosy essentials, thoughtful gifts and everyday favourites at special prices.</p></div>
    </Link>
  </section>;
};
