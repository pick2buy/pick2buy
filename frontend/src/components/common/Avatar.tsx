import { useEffect, useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  alt: string;
  className?: string;
}

export function Avatar({ src, name, alt, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <span aria-label={alt}>{name.trim().charAt(0).toUpperCase() || 'P'}</span>;
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
