import { prisma } from '../lib/prisma';
import { uploadProductImage } from '../lib/supabaseStorage';

const isEmbeddedImage = (value: string | null) => Boolean(value?.startsWith('data:image/'));

async function migrateBannerImages() {
  const banners = await prisma.banner.findMany({
    select: { id: true, desktopImageUrl: true, mobileImageUrl: true },
  });

  let migrated = 0;
  for (const banner of banners) {
    const desktopImageUrl = isEmbeddedImage(banner.desktopImageUrl)
      ? await uploadProductImage(banner.desktopImageUrl, `banners/${banner.id}/desktop`)
      : banner.desktopImageUrl;
    const mobileImageUrl = isEmbeddedImage(banner.mobileImageUrl)
      ? await uploadProductImage(banner.mobileImageUrl as string, `banners/${banner.id}/mobile`)
      : banner.mobileImageUrl;

    if (desktopImageUrl === banner.desktopImageUrl && mobileImageUrl === banner.mobileImageUrl) continue;
    // A legacy seed can contain a null title even though the current schema
    // requires one. Use SQL here so that row can be repaired and its image can
    // still be migrated instead of blocking the whole homepage optimization.
    await prisma.$executeRaw`
      UPDATE "banners"
      SET "desktopImageUrl" = ${desktopImageUrl},
          "mobileImageUrl" = ${mobileImageUrl},
          "title" = COALESCE("title", 'Pick2Buy promotion'),
          "updatedAt" = NOW()
      WHERE "id" = ${banner.id}
    `;
    migrated += 1;
    console.log(`Migrated banner ${migrated}.`);
  }
  console.log(`Finished. ${migrated} banner${migrated === 1 ? '' : 's'} now use cached Supabase Storage URLs.`);
}

migrateBannerImages()
  .catch((error) => {
    console.error('Banner image migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
