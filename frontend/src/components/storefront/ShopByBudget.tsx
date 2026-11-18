import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { optimizedImageUrl } from '../../lib/image';
import { formatINR } from '../../lib/utils';

type BudgetProduct = { id: string; name: string; price: number; stock?: number; images?: { url: string }[] };

export const selectBudgetProducts = (products: BudgetProduct[], budget: number, used: Set<string>) => {
  const images = new Set<string>();
  const picks: BudgetProduct[] = [];
  for (const product of products) {
    const image = product.images?.[0]?.url;
    if (!image || images.has(image) || used.has(product.id) || !Number.isFinite(Number(product.price)) || Number(product.price) < 0 || Number(product.price) > budget || (product.stock !== undefined && product.stock <= 0)) continue;
    images.add(image);
    used.add(product.id);
    picks.push(product);
    if (picks.length === 3) break;
  }
  return picks;
};

const budgets = [
  { price: 299, label: 'Little everyday finds', tone: 'cream' },
  { price: 499, label: 'More to discover', tone: 'peach' },
  { price: 999, label: 'Room for something extra', tone: 'navy' },
];

export const ShopByBudget = () => {
  const [products, setProducts] = useState<Record<number, BudgetProduct[]>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.allSettled(budgets.map(({ price }) => api.getProducts({ maxPrice: price, inStock: 'true', limit: 12 })))
      .then(results => {
        if (!active) return;
        setProducts(Object.fromEntries(results.map((result, index) => [budgets[index].price, result.status === 'fulfilled' ? result.value.data || [] : []])));
        setLoading(false);
      });
    return () => { active = false; };
  }, []);
  const used = new Set<string>();
  const cards = budgets.map(budget => ({ ...budget, picks: selectBudgetProducts(products[budget.price] || [], budget.price, used) }));
  return <section className="page-width home-section budget-section" aria-labelledby="budget-title">
  <div className="section-heading">
    <div><span className="eyebrow">YOUR BUDGET. YOUR PICKS.</span><h2 id="budget-title">Shop by budget.</h2><p>Find something you love, at a price that fits.</p></div>
    <Link to="/shop" className="text-link">Shop all <ArrowRight size={16} /></Link>
  </div>
  <div className="budget-grid">
    {cards.map(({ price, label, tone, picks }) => <Link key={price} to={`/shop?maxPrice=${price}`} className={`budget-card budget-card--${tone}`} aria-label={`Shop products priced up to ₹${price}`}>
      <span className="budget-card__label">{label}</span>
      <div className="budget-card__price"><span>UP TO</span><strong><span>₹</span>{price}</strong></div>
      <div className="budget-card__collage" aria-busy={loading}>
        {loading ? [0, 1, 2].map(index => <span key={index} className="budget-card__product budget-card__product--loading animate-pulse" aria-hidden="true" />) : picks.length ? picks.map(product => <div key={product.id} className="budget-card__product">
          <img src={optimizedImageUrl(product.images![0].url, 320)} alt={product.name} width={160} height={180} loading="lazy" decoding="async" data-original={product.images![0].url} onError={event => {
            const image = event.currentTarget;
            const original = image.dataset.original;
            if (original) { delete image.dataset.original; image.src = original; }
            else if (!image.src.endsWith('/product-placeholder.svg')) image.src = '/product-placeholder.svg';
          }} />
          <span>{formatINR(Number(product.price))}</span>
        </div>) : <span className="budget-card__empty">Explore products within your budget</span>}
      </div>
      <span className="budget-card__footer">Shop now <span className="budget-card__arrow"><ArrowRight size={20} aria-hidden="true" /></span></span>
    </Link>)}
  </div>
</section>;
};
