import { useEffect, useState } from 'react';
import { api } from '../services/api';

export type BannerPlacement = 'HERO' | 'CAMPAIGN' | 'ESSENTIALS';

export type StorefrontBanner = {
  id: string;
  placement: BannerPlacement;
  title?: string | null;
  subtitle?: string | null;
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  buttonText?: string | null;
  linkUrl: string;
  displayOrder?: number;
};

export const useStorefrontBanners = (placement: BannerPlacement) => {
  const [banners, setBanners] = useState<StorefrontBanner[] | null>(null);

  useEffect(() => {
    let active = true;
    api.getActiveBanners(placement)
      .then(response => {
        if (active) setBanners(response.data || []);
      })
      .catch(() => {
        if (active) setBanners([]);
      });
    return () => { active = false; };
  }, [placement]);

  return banners;
};
