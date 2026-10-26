import type { LucideIcon } from 'lucide-react';

// Blue details sit behind the shared outline so icons stay crisp at mobile sizes.
const accents: Record<string, string> = {
  popular: 'M18 2h3v6h-3z M16.5 3.5h6v3h-6z',
  'kurti-saree-and-lehenga': 'M3 12l9 5 9-5-9 2z',
  'women-western': 'M7 18h10v3H7z',
  men: 'M10 3a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  'kids-and-toys': 'M5 8q1-6 7-6q6 0 7 6h-5l-2-4-2 4z',
  'home-and-kitchen': 'M10 13h5v8h-5z',
  'jewellery-and-accessories': 'M8 9h8l-4 12z',
  'bags-and-footwear': 'M8 10q4 7 8 0v3q-4 5-8 0z',
  electronics: 'M3 4h18v12H3z',
  watches: 'M8 8h8v8H8z',
  'sports-and-fitness': 'M4 6l3-3 3 3-3 3z M14 18l3-3 3 3-3 3z',
  'car-and-motorbike': 'M6 4h12l2 5H4z',
  'office-supplies-and-stationery': 'M17 3l4 3-8 8-3 1 1-4z',
  grocery: 'M6 12h12l-2 7H8z',
  books: 'M4 3h6v16H4z',
  'pet-supplies': 'M8 16q4-7 8 0v3H8z',
  'musical-instruments': 'M13 3h7v5h-7z',
};

export function CategoryNavIcon({ slug, icon: Icon }: { slug: string; icon: LucideIcon }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="category-duotone-icon">
      {slug === 'lingerie' ? <g stroke="#263342" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3v5m14-5v5" />
        <path fill="#8cc5ff" d="M3 9q2-4 5-1l4 3 4-3q3-3 5 1v3q-4 3-9 0-5 3-9 0zM5 17h14l-5 5h-4z" />
      </g> : slug === 'beauty-and-health' ? <g stroke="#263342" strokeWidth="1.6" strokeLinejoin="round">
        <path fill="#8cc5ff" d="M9 10V3q0-3 6 1v6z" />
        <path d="M8 10h8v4H8zM7 14h10v8H7z" />
      </g> : <>
        <path d={accents[slug] || 'M8 8h8v8H8z'} fill="#8cc5ff" />
        <Icon x="0" y="0" width="24" height="24" stroke="#263342" strokeWidth={1.6} />
      </>}
    </svg>
  );
}
