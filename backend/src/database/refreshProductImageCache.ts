import { prisma } from '../lib/prisma';
import { cacheExistingProductImage } from '../lib/supabaseStorage';

async function refreshProductImageCache() {
  const images = await prisma.productImage.findMany({ select: { id: true, url: true } });
  console.log(`Checking ${images.length} product image${images.length === 1 ? '' : 's'} for cache upgrades.`);

  let refreshed = 0;
  let skipped = 0;
  for (const image of images) {
    const cachedUrl = await cacheExistingProductImage(image.url, `products/cached/${image.id}`);
    if (!cachedUrl) {
      skipped += 1;
      continue;
    }
    await prisma.productImage.update({ where: { id: image.id }, data: { url: cachedUrl } });
    refreshed += 1;
    console.log(`Updated ${refreshed} image${refreshed === 1 ? '' : 's'} with long-term caching.`);
  }
  console.log(`Finished. Refreshed ${refreshed}; skipped ${skipped}.`);
}

refreshProductImageCache()
  .catch((error) => {
    console.error('Image cache refresh failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
