import '../config';
import { prisma } from '../lib/prisma';

const categoryNames = [
  'Kurti, Saree & Lehenga',
  'Women Western',
  'Lingerie',
  'Men',
  'Kids & Toys',
  'Home & Kitchen',
  'Beauty & Health',
  'Jewellery & Accessories',
  'Bags & Footwear',
  'Electronics',
  'Watches',
  'Sports & Fitness',
  'Car & Motorbike',
  'Office Supplies & Stationery',
  'Grocery',
  'Books',
  'Pet Supplies',
  'Musical Instruments',
];

const slugFor = (name: string) => name.toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

async function main() {
  if (!/^postgres(?:ql)?:/i.test(process.env.DATABASE_URL || '')) {
    throw new Error('This category setup requires the configured PostgreSQL database.');
  }

  const result = await prisma.category.createMany({
    data: categoryNames.map((name, displayOrder) => ({
      name,
      slug: slugFor(name),
      displayOrder,
      featured: true,
    })),
    skipDuplicates: true,
  });

  console.log(`Added ${result.count} categories; ${categoryNames.length} requested categories are available.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
