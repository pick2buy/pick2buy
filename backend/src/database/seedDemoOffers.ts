import '../config';

// Supabase's session pool is intentionally small. This one-off seed should
// only borrow one connection while the local and deployed servers are running.
for (const environmentKey of ['DATABASE_URL', 'POSTGRES_DATABASE_URL'] as const) {
  if (!process.env[environmentKey]) continue;
  const databaseUrl = new URL(process.env[environmentKey] as string);
  databaseUrl.searchParams.set('connection_limit', '1');
  process.env[environmentKey] = databaseUrl.toString();
}

// Require runs after the connection limit above has been applied.
const { prisma } = require('../lib/prisma') as typeof import('../lib/prisma');

type DemoOffer = {
  name: string;
  sku: string;
  slug: string;
  categorySlug: string;
  price: number;
  mrp: number;
  stock: number;
  description: string;
  imageUrl: string;
};

const demoOffers: DemoOffer[] = [
  {
    name: 'Demo Portable Bluetooth Speaker',
    sku: 'DEMO-OFFER-SPEAKER-01',
    slug: 'demo-portable-bluetooth-speaker',
    categorySlug: 'electronics',
    price: 999,
    mrp: 1999,
    stock: 25,
    description: 'Demo offer product: a compact portable Bluetooth speaker with clear everyday sound and easy controls.',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=960&q=75',
  },
  {
    name: 'Demo Everyday Canvas Tote Bag',
    sku: 'DEMO-OFFER-TOTE-01',
    slug: 'demo-everyday-canvas-tote-bag',
    categorySlug: 'bags-and-footwear',
    price: 399,
    mrp: 999,
    stock: 40,
    description: 'Demo offer product: a lightweight canvas tote bag for everyday shopping, work, and weekend use.',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=960&q=75',
  },
  {
    name: 'Demo Insulated Water Bottle 500 ml',
    sku: 'DEMO-OFFER-BOTTLE-01',
    slug: 'demo-insulated-water-bottle-500ml',
    categorySlug: 'home-and-kitchen',
    price: 549,
    mrp: 1099,
    stock: 30,
    description: 'Demo offer product: a reusable insulated 500 ml water bottle for home, office, travel, and workouts.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=960&q=75',
  },
  {
    name: 'Demo Resistance Band Fitness Set',
    sku: 'DEMO-OFFER-BANDS-01',
    slug: 'demo-resistance-band-fitness-set',
    categorySlug: 'sports-and-fitness',
    price: 449,
    mrp: 899,
    stock: 35,
    description: 'Demo offer product: a versatile resistance band set for home workouts, stretching, mobility, and training.',
    imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=960&q=75',
  },
];

async function seedDemoOffers() {
  let created = 0;
  let existing = 0;

  for (const offer of demoOffers) {
    const category = await prisma.category.findUnique({ where: { slug: offer.categorySlug }, select: { id: true } });
    if (!category) throw new Error(`Missing category: ${offer.categorySlug}`);

    const alreadyExists = await prisma.product.findUnique({ where: { sku: offer.sku }, select: { id: true } });
    if (alreadyExists) {
      existing += 1;
      continue;
    }

    const discountPercentage = Math.round(((offer.mrp - offer.price) / offer.mrp) * 100);
    await prisma.product.create({
      data: {
        name: offer.name,
        sku: offer.sku,
        slug: offer.slug,
        description: offer.description,
        price: offer.price,
        mrp: offer.mrp,
        discountPercentage,
        stock: offer.stock,
        status: 'ACTIVE',
        sourcePlatform: 'OWN',
        categoryId: category.id,
        isFlashDeal: true,
        images: {
          create: { url: offer.imageUrl, altText: offer.name, isPrimary: true, displayOrder: 0 },
        },
      },
    });
    created += 1;
    console.log(`Created: ${offer.name}`);
  }

  console.log(`Finished. Created ${created}; ${existing} already existed.`);
}

seedDemoOffers()
  .catch((error) => {
    console.error('Demo offer seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
