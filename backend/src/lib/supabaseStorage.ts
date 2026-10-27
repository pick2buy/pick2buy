import { randomUUID } from 'crypto';
import { config } from '../config';

type DataImage = { contentType: 'image/jpeg' | 'image/png' | 'image/webp'; buffer: Buffer; extension: string };

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

/** Uploads an admin-provided image without ever exposing the service-role key to the browser. */
export const uploadProductImage = async (dataUrl: string, folder = 'products') => {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new StorageError('Supabase Storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the backend environment.', 503);
  }

  const image = parseDataImage(dataUrl);
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'products';
  const objectPath = `${safeFolder}/${Date.now()}-${randomUUID()}.${image.extension}`;
  const projectUrl = config.supabase.url.replace(/\/$/, '');
  const bucket = config.supabase.productImageBucket;

  let response: globalThis.Response;
  try {
    response = await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        apikey: config.supabase.serviceRoleKey,
        'Content-Type': image.contentType,
        'x-upsert': 'false',
      },
      body: image.buffer,
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
