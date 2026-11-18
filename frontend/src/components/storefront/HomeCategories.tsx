import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { optimizedImageUrl } from '../../lib/image';

type Category = { id: string; name: string; slug: string; imageUrl?: string | null; isVisible?: boolean };

export const HomeCategories = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * .75, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    let active = true;
    api.getCategories()
      .then(response => {
        if (active) setCategories((response.data || []).filter((category: Category) => category.isVisible !== false));
      })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  if (categories?.length === 0) return null;

  return <section className="page-width home-section home-categories" aria-labelledby="home-categories-title">
    <div className="section-heading">
      <h2 id="home-categories-title">Shop by category.</h2>
      <div className="home-categories__controls">
        <button type="button" onClick={() => scroll(-1)} aria-label="Scroll categories left" aria-controls="home-category-track"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => scroll(1)} aria-label="Scroll categories right" aria-controls="home-category-track"><ChevronRight size={18} /></button>
      </div>
    </div>
    <div ref={trackRef} id="home-category-track" className="home-category-grid" role="region" aria-label="Product categories, scroll horizontally to explore" tabIndex={0} aria-busy={categories === null}>
      {categories === null ? Array.from({ length: 10 }, (_, index) => <div key={index} className="home-category-skeleton animate-pulse" aria-hidden="true" />) : categories.map(category => {
        const fallback = `/categories/${category.slug}.webp`;
        return <Link to={`/category/${category.slug}`} key={category.id} className="home-category-card">
          <div className="home-category-card__image"><img
            src={category.imageUrl ? optimizedImageUrl(category.imageUrl, 480) : fallback}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            onError={event => {
              const image = event.currentTarget;
              const next = image.dataset.fallback;
              if (!next) return;
              image.dataset.fallback = next === '/product-placeholder.svg' ? '' : next === fallback ? '/product-placeholder.svg' : fallback;
              image.src = next;
            }}
            data-fallback={category.imageUrl ? category.imageUrl : '/product-placeholder.svg'}
          /></div>
          <div className="home-category-card__label"><h3>{category.name}</h3></div>
        </Link>;
      })}
    </div>
  </section>;
};
