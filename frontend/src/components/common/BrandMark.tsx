type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Original Pick2Buy mark: a linked shopping cart with a fast, forward-moving silhouette. */
export const BrandMark = ({ className = '', title }: BrandMarkProps) => (
  <svg viewBox="0 0 64 52" fill="none" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
    {title && <title>{title}</title>}
    <path d="M5 10h11l8 25a7 7 0 0 0 6.6 4.7h22.8" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 17h29.5a5.5 5.5 0 0 1 5.2 7.3l-4.7 13.2a5.5 5.5 0 0 1-5.2 3.7H28" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h10M8 29h8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <circle cx="31" cy="46" r="3.5" fill="currentColor" />
    <circle cx="50" cy="46" r="3.5" fill="currentColor" />
  </svg>
);
