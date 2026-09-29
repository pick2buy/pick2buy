import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export const HeroBanner = () => (
  <section className="editorial-hero">
    <div className="hero-intro">
      <span className="eyebrow-pill"><span /> A little discovery. A better everyday.</span>
      <h1>Your next favourite.<br />Just a <em>pick away.</em></h1>
      <p>Thoughtful finds for your home, your wardrobe, and everything in between. Discover your everyday with Pick2Buy.</p>
      <div className="hero-actions">
        <Link to="/shop" className="primary-pill">Find your favourites <ArrowRight size={17} /></Link>
        <Link to="/shop?sort=newest" className="text-link">Explore new arrivals <ArrowRight size={16} /></Link>
      </div>
    </div>
    <div className="hero-collection">
      <div className="hero-feature">
        <span className="eyebrow">THE EVERYDAY EDIT / 01</span>
        <h2>Small upgrades.<br /><em>Big difference.</em></h2>
        <p>Discover audio, accessories and clever essentials that fit into your life.</p>
        <Link to="/category/electronics" className="primary-pill">Explore the edit <ArrowRight size={17} /></Link>
        <span className="hero-caption"><ShoppingBag size={15} /> Curated by Pick2Buy</span>
      </div>
      <Link to="/category/electronics" className="hero-photo" aria-label="Shop the electronics collection">
        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85" alt="Minimal black headphones on a warm yellow background" fetchPriority="high" />
        <span>Sound good. Feel good. <ArrowRight size={20} /></span>
      </Link>
    </div>
  </section>
);
