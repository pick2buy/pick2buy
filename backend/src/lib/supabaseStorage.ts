import { randomUUID } from 'crypto';
import { config } from '../config';

type DataImage = { contentType: 'image/jpeg' | 'image/png' | 'image/webp'; buffer: Buffer; extension: string };
type SupportedContentType = DataImage['contentType'];

// Product uploads always receive a unique path, so a long cache lifetime is safe:
// changing a product image produces a new URL rather than replacing the old file.
const PRODUCT_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export class StorageError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const parseDataImage = (value: string): DataImage => {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) throw new StorageError('Choose a PNG, JPEG, or WebP image.');

  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > 5_000_000) {
    throw new StorageError('Choose an image smaller than 5 MB.');
  }

  const contentType = match[1].toLowerCase() as DataImage['contentType'];
  return { contentType, buffer, extension: contentType === 'image/jpeg' ? 'jpg' : contentType.slice('image/'.length) };
};

const imageExtension = (contentType: SupportedContentType) => contentType === 'image/jpeg' ? 'jpg' : contentType.slice('image/'.length);

const assertConfigured = () => {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new StorageError('Supabase Storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the backend environment.', 503);
  }
};

const uploadImageBuffer = async (buffer: Buffer, contentType: SupportedContentType, folder: string) => {
  assertConfigured();
  if (!buffer.length || buffer.length > 5_000_000) throw new StorageError('Choose an image smaller than 5 MB.');

  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'products';
  const objectPath = `${safeFolder}/${Date.now()}-${randomUUID()}.${imageExtension(contentType)}`;
  const projectUrl = config.supabase.url.replace(/\/$/, '');
  const bucket = config.supabase.productImageBucket;

  let response: globalThis.Response;
  try {
    response = await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        apikey: config.supabase.serviceRoleKey,
        'Content-Type': contentType,
        // Tell the CDN and browser that this versioned image can be reused for a year.
        'cache-control': PRODUCT_IMAGE_CACHE_CONTROL,
        'x-upsert': 'false',
      },
      body: buffer,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new StorageError('Could not reach Supabase Storage. Please try again.', 503);
  }

  if (!response.ok) {
    throw new StorageError('Supabase Storage rejected this image. Confirm that the product-images bucket exists and is public.', 502);
  }

  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
};

/** Uploads an admin-provided image without ever exposing the service-role key to the browser. */
export const uploadProductImage = async (dataUrl: string, folder = 'products') => {
  const image = parseDataImage(dataUrl);
  return uploadImageBuffer(image.buffer, image.contentType, folder);
};

/**
 * Copies an existing public product image to a new versioned object with the
 * correct long-lived cache policy. Invalid and non-Supabase URLs are skipped.
 */
export const cacheExistingProductImage = async (url: string, folder = 'products/cached') => {
  assertConfigured();
  const projectUrl = config.supabase.url.replace(/\/$/, '');
  const expectedPrefix = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(config.supabase.productImageBucket)}/`;
  if (!url.startsWith(expectedPrefix)) return null;

  let response: globalThis.Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new StorageError('Could not retrieve an existing product image. Please try again.', 503);
  }

  if (!response.ok) {
    throw new StorageError('Supabase Storage could not retrieve an existing product image.', 502);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase();
  if (contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') {
    throw new StorageError('An existing product image has an unsupported format.', 400);
  }
  return uploadImageBuffer(Buffer.from(await response.arrayBuffer()), contentType, folder);
};
