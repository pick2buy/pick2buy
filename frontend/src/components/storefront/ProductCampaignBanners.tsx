import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorefrontBanners } from '../../hooks/useStorefrontBanners';
import { optimizedImageUrl } from '../../lib/image';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  discountPercentage?: number | null;
  images?: { url: string }[];
  category?: { name?: string | null } | null;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
};

type Campaign = { key: string; image: string; mobileImage?: string | null; title: string; link: string };

const priority = (product: Product) => Number(Boolean(product.isFlashDeal)) * 4 + Number(Boolean(product.isBestSeller)) * 3 + Number(Boolean(product.isTrending)) * 2;

const campaignArtwork = (product: Product) => {
  const identity = `${product.slug} ${product.name}`.toLowerCase();
  if (/food.dispenser|cereal.dispenser/.test(identity)) return 'food-dispenser';
  if (/crystal.*(?:string|light)/.test(identity)) return 'crystal-lights';
  if (/shoe.*clean/.test(identity)) return 'shoe-cleaner';
  return null;
};

export const ProductCampaignBanners = ({ products }: { products: Product[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  const managedBanners = useStorefrontBanners('CAMPAIGN');
  // Similar catalog listings can share campaign artwork. Show each product
  // and artwork only once so variants do not repeat the same banner image.
  const seenProducts = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenArtwork = new Set<string>();
  const selectedProducts = [...products]
    .filter(product => product.slug && product.name && campaignArtwork(product))
    .sort((a, b) => priority(b) - priority(a))
    .filter(product => {
      const artwork = campaignArtwork(product)!;
      const slug = product.slug.trim().toLowerCase();
      if (seenProducts.has(product.id) || seenSlugs.has(slug) || seenArtwork.has(artwork)) return false;
      seenProducts.add(product.id);
      seenSlugs.add(slug);
      seenArtwork.add(artwork);
      return true;
    });
  const dispenser = selectedProducts.find(product => campaignArtwork(product) === 'food-dispenser');
  const fallbackCampaigns: Campaign[] = [
    { key: 'winter-food-dispenser', image: '/banners/pick2buy/campaigns/winter-food-dispenser.webp', title: '6-compartment dry food dispenser', link: dispenser ? `/product/${dispenser.slug}` : '/search?q=dry%20food%20dispenser' },
    { key: 'winter-leather-jacket', image: '/banners/pick2buy/campaigns/winter-leather-jacket.webp', title: "Men's leather jacket winter collection", link: '/product/men-riding-jacket' },
    ...selectedProducts.filter(product => campaignArtwork(product) !== 'food-dispenser').map(product => ({ key: product.id, image: `/banners/pick2buy/campaigns/winter-${campaignArtwork(product)}.webp`, title: product.name, link: `/product/${product.slug}` })),
  ];
  const campaigns: Campaign[] = managedBanners?.length
    ? managedBanners.map(banner => ({ key: banner.id, image: banner.desktopImageUrl, mobileImage: banner.mobileImageUrl, title: banner.title || 'Pick2Buy promotion', link: banner.linkUrl }))
    : fallbackCampaigns;
  const move = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    track.scrollBy({ left: direction * ((card?.offsetWidth || track.clientWidth) + 12), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    const track = trackRef.current;
    const carousel = track?.parentElement;
    if (!track || !carousel || campaigns.length < 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let hovering = false;
    let touching = false;
    let lastInteraction = 0;
    const interact = () => { lastInteraction = Date.now(); };
    const enter = (event: PointerEvent) => { if (event.pointerType === 'mouse') hovering = true; };
    const leave = () => { hovering = false; interact(); };
    const down = () => { touching = true; interact(); };
    const up = () => { touching = false; interact(); };
    const timer = window.setInterval(() => {
      const bounds = track.getBoundingClientRect();
      if (document.hidden || reducedMotion.matches || hovering || touching || carousel.contains(document.activeElement) || Date.now() - lastInteraction < 5000 || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll < 2) return;
      const card = track.firstElementChild as HTMLElement | null;
      const step = (card?.offsetWidth || track.clientWidth) + parseFloat(getComputedStyle(track).columnGap || '0');
      track.scrollTo({ left: track.scrollLeft >= maxScroll - 2 ? 0 : Math.min(track.scrollLeft + step, maxScroll), behavior: 'smooth' });
    }, 5000);

    carousel.addEventListener('pointerenter', enter);
    carousel.addEventListener('pointerleave', leave);
    carousel.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    carousel.addEventListener('wheel', interact, { passive: true });
    carousel.addEventListener('keydown', interact);
    carousel.addEventListener('focusout', interact);
    document.addEventListener('visibilitychange', interact);
    return () => {
      window.clearInterval(timer);
      carousel.removeEventListener('pointerenter', enter);
      carousel.removeEventListener('pointerleave', leave);
      carousel.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      carousel.removeEventListener('wheel', interact);
      carousel.removeEventListener('keydown', interact);
      carousel.removeEventListener('focusout', interact);
      document.removeEventListener('visibilitychange', interact);
    };
  }, [campaigns.length]);

  if (!campaigns.length) return null;

  return <section className="page-width home-section product-campaign-section" aria-label="Featured product offers">
    <div className="product-campaign-carousel">
      <div className="product-campaign-track" ref={trackRef} onScroll={event => {
        const track = event.currentTarget;
        setPosition({ start: track.scrollLeft < 2, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 });
      }}>
        {campaigns.map(({ key, image, mobileImage, title, link }, index) => {
          const artwork = <picture><source media="(max-width: 639px)" srcSet={optimizedImageUrl(mobileImage || image)} /><img className="product-campaign__visual" src={optimizedImageUrl(image)} alt={title} loading="lazy" decoding="async" /></picture>;
          const className = `product-campaign product-campaign--tone-${index % 4} product-campaign--artwork`;
          return link.startsWith('/')
            ? <Link key={key} to={link} aria-label={`Shop ${title}`} className={className}>{artwork}</Link>
            : <a key={key} href={link} aria-label={`Shop ${title}`} className={className}>{artwork}</a>;
        })}
      </div>
      {campaigns.length > 1 && <>
        <button type="button" className="product-campaign-arrow product-campaign-arrow--previous" aria-label="Previous offers" disabled={position.start} onClick={() => move(-1)}><ChevronLeft size={22} /></button>
        <button type="button" className="product-campaign-arrow product-campaign-arrow--next" aria-label="Next offers" disabled={position.end} onClick={() => move(1)}><ChevronRight size={22} /></button>
      </>}
    </div>
  </section>;
};
