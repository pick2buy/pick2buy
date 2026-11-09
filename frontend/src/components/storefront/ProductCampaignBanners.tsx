import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  discountPercentage?: number | null;
  category?: { name?: string | null } | null;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
};

const campaignThemes = [
  { theme: 'orange', eyebrow: 'PICK2BUY SPECIAL', description: 'A standout pick, at a price worth smiling about.' },
  { theme: 'tech', eyebrow: 'FRESH FINDS', description: 'Everyday upgrades selected for your home and life.' },
  { theme: 'mint', eyebrow: 'GOOD CHOICE', description: 'Useful essentials, ready when you are.' },
  { theme: 'coral', eyebrow: 'VALUE DROP', description: 'Little prices. Big reasons to add to bag.' },
] as const;

const priority = (product: Product) => Number(Boolean(product.isFlashDeal)) * 4 + Number(Boolean(product.isBestSeller)) * 3 + Number(Boolean(product.isTrending)) * 2;
const formatPrice = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const productVisualFor = (theme: string) => theme === 'orange' ? 'food-dispenser' : theme === 'tech' ? 'crystal-lights' : theme === 'mint' ? 'led-diya' : 'shoe-cleaner';

export const ProductCampaignBanners = ({ products }: { products: Product[] }) => {
  const campaigns = [...products]
    .filter(product => product.slug && product.name)
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, campaignThemes.length)
    .map((product, index) => ({ product, ...campaignThemes[index] }));

  if (!campaigns.length) return null;

  return <section className="page-width home-section product-campaign-section" aria-label="Featured product picks">
    <div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>New finds. <em>Worth a look.</em></h2></div><Link to="/shop" className="text-link">Shop all <ArrowRight size={16} /></Link></div>
    <div className="product-campaign-grid">
      {campaigns.map(({ product, theme, eyebrow, description }, index) => {
        const saving = product.discountPercentage || (product.mrp && product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);
        const productVisual = productVisualFor(theme);
        return <Link key={product.id} to={`/product/${product.slug}`} className={`product-campaign product-campaign--${theme} product-campaign--${index + 1}`}>
          <div className="product-campaign__copy"><span className="product-campaign__eyebrow">{eyebrow}</span><h3>{product.name}</h3><p>{product.category?.name || 'Pick2Buy favourite'} · {description}</p><div className="product-campaign__price"><strong>{formatPrice(product.price)}</strong>{saving > 0 && <span>Save {saving}%</span>}</div><span className="product-campaign__cta">Shop now <ArrowRight size={14} /></span></div>
          <img className="product-campaign__visual" src={`/banners/pick2buy/products/${productVisual}.webp`} alt="" aria-hidden="true" loading={index < 2 ? 'eager' : 'lazy'} fetchPriority={index < 2 ? 'high' : 'low'} decoding="async" />
        </Link>;
      })}
    </div>
  </section>;
};
