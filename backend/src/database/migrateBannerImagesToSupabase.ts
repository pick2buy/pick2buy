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
    // Banner titles are optional because AI-generated banners often include
    // their headline directly in the artwork.
    await prisma.$executeRaw`
      UPDATE "banners"
      SET "desktopImageUrl" = ${desktopImageUrl},
          "mobileImageUrl" = ${mobileImageUrl},
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
