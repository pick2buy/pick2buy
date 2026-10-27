const imageWidths = [320, 480, 720] as const;

/**
 * Unsplash supports server-side resizing. Product cards are small enough that
 * requesting the original 800px image wastes time and mobile data.
 */
export const optimizedImageUrl = (url: string, width = 480) => {
  if (!url || url.startsWith('data:')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', width <= 320 ? '68' : '74');
      return parsed.toString();
    }
  } catch {
    // A relative image path can be used as-is.
  }

  return url;
};

export const productImageSrcSet = (url: string) => {
  if (!url || url.startsWith('data:')) return undefined;
  try {
    if (new URL(url).hostname !== 'images.unsplash.com') return undefined;
  } catch {
    return undefined;
  }

  return imageWidths.map(width => `${optimizedImageUrl(url, width)} ${width}w`).join(', ');
};
