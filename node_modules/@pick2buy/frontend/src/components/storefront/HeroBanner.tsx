import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  tag: string;
  buttonText: string;
  linkUrl: string;
  imageUrl: string;
  accentBg: string;
}

const slides: Slide[] = [
  {
    title: 'Precision Sound, Pure Silence.',
    subtitle: 'Next-generation ANC earbuds, studio headphones and Bluetooth acoustic systems engineered for life in motion.',
    tag: 'NEW AUDIO RELEASE',
    buttonText: 'Shop Electronics',
    linkUrl: '/category/electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&auto=format&fit=crop&q=80',
    accentBg: 'from-slate-950 via-slate-900 to-indigo-950',
  },
  {
    title: 'Effortless Comfort & Modern Aesthetics.',
    subtitle: '100% Organic French Linen, Supima cotton tees, and tailored chinos tailored for everyday elegance.',
    tag: 'FESTIVE COLLECTION 2026',
    buttonText: 'Explore Fashion',
    linkUrl: '/category/fashion',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80',
    accentBg: 'from-stone-950 via-slate-900 to-neutral-900',
  },
  {
    title: 'Smart Gadgets for Accelerated Living.',
    subtitle: 'Ultra-fast 65W GaN chargers, MagSafe batteries and AMOLED fitness watches with up to 60% discounts.',
    tag: 'FLASH SAVINGS',
    buttonText: 'Claim Deals',
    linkUrl: '/shop?flashDeal=true',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&auto=format&fit=crop&q=80',
    accentBg: 'from-indigo-950 via-slate-900 to-purple-950',
  },
];

export const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 max-w-7xl lg:mx-auto my-6 shadow-soft">
      <div className={`relative min-h-[460px] sm:min-h-[520px] flex items-center bg-gradient-to-r ${slide.accentBg} text-white`}>
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{slide.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-[1.15] text-balance">
            {slide.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={slide.linkUrl}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-brand-primary/30 transition-all hover:scale-105"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/shop"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full transition-colors"
            >
              View Catalog
            </Link>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-6 left-6 sm:left-12 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-brand-primary' : 'w-2 bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
