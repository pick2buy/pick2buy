import { prisma } from '../lib/prisma';
import { uploadProductImage } from '../lib/supabaseStorage';

async function migrateProductImages() {
  const images = await prisma.productImage.findMany({
    where: { url: { startsWith: 'data:image/' } },
    select: { id: true, url: true },
  });

  console.log(`Found ${images.length} embedded product image${images.length === 1 ? '' : 's'}.`);
  let migrated = 0;
  for (const image of images) {
    const url = await uploadProductImage(image.url, `products/migrated/${image.id}`);
    await prisma.productImage.update({ where: { id: image.id }, data: { url } });
    migrated += 1;
    console.log(`Migrated ${migrated}/${images.length}`);
  }
  console.log(`Finished. ${migrated} product image${migrated === 1 ? '' : 's'} now use Supabase Storage URLs.`);
}

migrateProductImages()
  .catch((error) => {
    console.error('Image migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
