const imageWidths = [320, 480, 720] as const;

const supabasePublicObjectPath = '/storage/v1/object/public/';

const supportsResponsiveTransform = (parsed: URL) =>
  parsed.hostname === 'images.unsplash.com' || parsed.pathname.includes(supabasePublicObjectPath);

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
      parsed.searchParams.set('fit', 'contain');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', width <= 320 ? '68' : '74');
      return parsed.toString();
    }

    // Supabase Storage can generate a right-sized WebP image at the CDN edge.
    // This prevents a 960px uploaded photo from being downloaded in full for a
    // 160–320px product card. If Image Transformations are unavailable for a
    // project, the component falls back to the original public object URL.
    if (parsed.pathname.includes(supabasePublicObjectPath)) {
      parsed.pathname = parsed.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      parsed.searchParams.set('width', String(width));
      parsed.searchParams.set('quality', width <= 320 ? '68' : '74');
      // Preserve the complete product photo in fixed-size cards. The card can
      // provide its own neutral background instead of cutting off the edges.
      parsed.searchParams.set('resize', 'contain');
      parsed.searchParams.set('format', 'webp');
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
    if (!supportsResponsiveTransform(new URL(url))) return undefined;
  } catch {
    return undefined;
  }

  return imageWidths.map(width => `${optimizedImageUrl(url, width)} ${width}w`).join(', ');
};
