const path = require('path');
const dotenv = require('dotenv');
const sharp = require('sharp');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (process.env.POSTGRES_DATABASE_URL) process.env.DATABASE_URL = process.env.POSTGRES_DATABASE_URL;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const asWebpDataUrl = async (value) => {
  const [header, encoded] = value.split(',', 2);
  if (!header || !encoded) throw new Error('Invalid image data URL');
  const source = Buffer.from(encoded, 'base64');
  const webp = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 4 })
    .toBuffer();
  return `data:image/webp;base64,${webp.toString('base64')}`;
};

async function main() {
  const images = await prisma.productImage.findMany({
    where: { url: { startsWith: 'data:image/' } },
    select: { id: true, url: true },
  });

  let converted = 0;
  let beforeBytes = 0;
  let afterBytes = 0;

  for (const image of images) {
    const nextUrl = await asWebpDataUrl(image.url);
    beforeBytes += image.url.length;
    afterBytes += nextUrl.length;
    await prisma.productImage.update({ where: { id: image.id }, data: { url: nextUrl } });
    converted += 1;
  }

  const saved = Math.max(0, beforeBytes - afterBytes);
  console.log(`Converted ${converted} product images to WebP. Saved about ${(saved / 1024).toFixed(1)} KB.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
