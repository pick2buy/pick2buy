import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';

export const Footer = () => <footer className="store-footer">
  <div className="page-width footer-grid">
    <div><Link className="footer-brand" to="/"><ShoppingBag size={26} /> Pick<span>2</span>Buy</Link><p>Everyday finds. Thoughtfully picked.<br />A little something for every part of your life.</p><a href="mailto:pick2buy.in@gmail.com">pick2buy.in@gmail.com <ArrowUpRight size={14} /></a></div>
    <div><h3>Discover</h3><Link to="/shop">Shop all</Link><Link to="/shop?sort=newest">New arrivals</Link><Link to="/shop?sort=bestseller">Best sellers</Link><Link to="/shop?flashDeal=true">Deals</Link></div>
    <div><h3>Your Pick2Buy</h3><Link to="/account">Account & orders</Link><Link to="/wishlist">Your wishlist</Link><Link to="/cart">Shopping bag</Link><a href="mailto:pick2buy.in@gmail.com">Contact support</a></div>
    <div className="footer-note"><span className="eyebrow">SOMETHING NEW TO LOVE</span><h3>Your next find<br />is waiting.</h3><Link className="primary-pill" to="/shop">Take a look <ArrowUpRight size={16} /></Link></div>
  </div>
  <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} Pick2Buy. All rights reserved.</span><span>Made for everyday life in India · Prices in INR ₹</span></div>
</footer>;
