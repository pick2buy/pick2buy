import '../config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' || /^postgres(?:ql)?:/i.test(process.env.DATABASE_URL || '')) {
    throw new Error('Demo seed is disabled for the production PostgreSQL database.');
  }

  console.log('🌱 Starting Pick2Buy database seeding...');

  // 1. Roles & Permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Super Administrator with full platform control' },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Standard Customer Account' },
  });

  // 2. Users (Admin + 5 realistic Indian Customers)
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
  const userPasswordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pick2buy.in' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN' },
    create: {
      email: 'admin@pick2buy.in',
      name: 'Pick2Buy Admin',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  console.log(`✅ Demo Admin Created: ${admin.email} / ChangeMe123!`);

  const demoCustomersData = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '9820112233', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { name: 'Priya Patel', email: 'priya.patel@example.com', phone: '9879112244', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015' },
    { name: 'Rohan Iyer', email: 'rohan.iyer@example.com', phone: '9845112255', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    { name: 'Ananya Verma', email: 'ananya.verma@example.com', phone: '9810112266', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    { name: 'Vikram Reddy', email: 'vikram.reddy@example.com', phone: '9866112277', city: 'Hyderabad', state: 'Telangana', pincode: '500034' },
  ];

  const createdCustomers: any[] = [];
  for (const c of demoCustomersData) {
    const cust = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash: userPasswordHash,
        role: 'CUSTOMER',
        isEmailVerified: true,
        addresses: {
          create: {
            fullName: c.name,
            mobile: c.phone,
            email: c.email,
            addressLine: `Flat 402, Sunshine Residency, Main Road`,
            city: c.city,
            state: c.state,
            pincode: c.pincode,
            isDefault: true,
          },
        },
      },
      include: { addresses: true },
    });
    createdCustomers.push(cust);
  }

  // 3. Brands
  const brandsData = [
    { name: 'Pick2Buy Signature', slug: 'pick2buy-signature' },
    { name: 'AcousticPro', slug: 'acousticpro' },
    { name: 'UrbanFit', slug: 'urbanfit' },
    { name: 'VoltCharge', slug: 'voltcharge' },
    { name: 'Zenith Living', slug: 'zenith-living' },
    { name: 'Aura Lifestyle', slug: 'aura-lifestyle' },
  ];

  const createdBrands: Record<string, any> = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    createdBrands[b.slug] = brand;
  }

  // 4. 8 Categories
  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, audio devices, smart wearables and tech gear' },
    { name: 'Mobile Accessories', slug: 'mobile-accessories', description: 'High-speed chargers, cables, power banks and protective gear' },
    { name: 'Fashion & Apparel', slug: 'fashion', description: 'Contemporary Indian & Western apparel designed for comfort and style' },
    { name: 'Footwear', slug: 'footwear', description: 'Performance athletic shoes, loafers and casual everyday sneakers' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Modern kitchen appliances, storage solutions and aesthetic decor' },
    { name: 'Health & Fitness', slug: 'health-fitness', description: 'Resistance bands, yoga mats, gym bottles and massage guns' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Skincare, grooming kits, hair care essentials and organic oils' },
    { name: 'Office & Stationery', slug: 'office-stationery', description: 'Ergonomic accessories, desk pads, organizers and notebooks' },
  ];

  const createdCategories: Record<string, any> = {};
  for (let i = 0; i < categoriesData.length; i++) {
    const c = categoriesData[i];
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        ...c,
        displayOrder: i,
        featured: true,
      },
    });
    createdCategories[c.slug] = cat;
  }

  // 5. 30 Products
  const productsList = [
    // Electronics (5)
    {
      name: 'SonicBlast ANC Pro Wireless Earbuds',
      slug: 'sonicblast-anc-pro-wireless-earbuds',
      sku: 'EL-EAR-001',
      price: 2499,
      mrp: 4999,
      stock: 45,
      categorySlug: 'electronics',
      brandSlug: 'acousticpro',
      description: 'Experience pure acoustic fidelity with active noise cancellation up to 40dB, 36-hour battery life, low-latency gaming mode, and IPX5 sweat resistance.',
      highlights: ['Active Noise Cancellation 40dB', '36 Hours Combined Playtime', 'Quad-Mic ENC for Crystal Clear Calls', 'Bluetooth v5.3 Instant Pairing'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'AeroPulse 1.96" AMOLED Smartwatch',
      slug: 'aeropulse-amoled-smartwatch',
      sku: 'EL-WAT-002',
      price: 2999,
      mrp: 6499,
      stock: 30,
      categorySlug: 'electronics',
      brandSlug: 'urbanfit',
      description: 'Sleek zinc-alloy casing with Always-On AMOLED display, 120+ sports modes, Bluetooth HD calling, continuous SpO2 and Heart Rate tracking.',
      highlights: ['Ultra Bright 1000 Nits AMOLED Display', 'Bluetooth HD Calling with Speaker', 'IP68 Water & Dust Resistant', '7 Days Battery Backup'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'BassMatrix Portable Bluetooth Speaker 20W',
      slug: 'bassmatrix-portable-bluetooth-speaker',
      sku: 'EL-SPK-003',
      price: 1899,
      mrp: 3999,
      stock: 60,
      categorySlug: 'electronics',
      brandSlug: 'acousticpro',
      description: 'Booming 360-degree sound with dual passive radiators, dynamic RGB party lights, IPX7 waterproof housing and TWS wireless pairing.',
      highlights: ['20W Punchy Stereo Sound', 'IPX7 Fully Waterproof', '12 Hours Playback Time', 'Built-in RGB Equalizer Lights'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'HyperDrive 65W GaN Dual-Port Fast Charger',
      slug: 'hyperdrive-65w-gan-fast-charger',
      sku: 'EL-CHG-004',
      price: 1499,
      mrp: 2999,
      stock: 80,
      categorySlug: 'mobile-accessories',
      brandSlug: 'voltcharge',
      description: 'Next-gen Gallium Nitride (GaN) technology provides ultra-compact 65W power delivery for laptops, MacBooks, iPhones, and Android devices simultaneously.',
      highlights: ['65W Total Power Delivery', 'Dual Type-C + USB-A ports', 'Compact 40% Smaller than OEM chargers', 'Comprehensive Surge & Heat Protection'],
      isFeatured: true,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'TitaniumBraided 100W PD Type-C Cable 2M',
      slug: 'titanium-braided-100w-type-c-cable',
      sku: 'EL-CAB-005',
      price: 499,
      mrp: 1199,
      stock: 120,
      categorySlug: 'mobile-accessories',
      brandSlug: 'voltcharge',
      description: 'Indestructible aramid fiber braided exterior tested for 30,000+ bends. Built-in E-marker chip supports 100W rapid charging and 480Mbps data transfer.',
      highlights: ['100W E-Marker Fast Charging', '30,000+ Bend Lifespan', '2 Meters Extended Length', 'Aluminum Alloy Connector Shells'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'MagShield 10,000mAh Magnetic Power Bank',
      slug: 'magshield-10000mah-magnetic-power-bank',
      sku: 'EL-POW-006',
      price: 1999,
      mrp: 3999,
      stock: 25,
      categorySlug: 'mobile-accessories',
      brandSlug: 'voltcharge',
      description: 'Ultra-thin wireless magnetic battery pack with strong N52 neodymium magnets, 15W Qi wireless output, and 20W PD Type-C wired fast charging.',
      highlights: ['Strong Magnetic Snap Lock', '15W Wireless + 20W Wired PD', 'Foldable Kickstand for Video Watching', 'Flight Approved Safe Battery'],
      isFeatured: true,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1609592426868-8e65e6308cfc?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'AutoGrip Wireless Car Charger & Phone Mount',
      slug: 'autogrip-wireless-car-charger-mount',
      sku: 'EL-CAR-007',
      price: 1299,
      mrp: 2499,
      stock: 40,
      categorySlug: 'mobile-accessories',
      brandSlug: 'voltcharge',
      description: 'Smart infrared sensor automatically detects phone and closes clamp securely. Delivers 15W Qi fast wireless charging on air vents or dashboard.',
      highlights: ['Smart Infrared Automatic Clamping', '15W Fast Wireless Qi Output', '360° Ball Joint for Ideal Angles', 'Works through thick phone cases'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    },
    // Fashion & Apparel (5)
    {
      name: 'Pure Linen Mandarin Collar Casual Shirt',
      slug: 'pure-linen-mandarin-collar-casual-shirt',
      sku: 'FAS-SHT-008',
      price: 1599,
      mrp: 3299,
      stock: 50,
      categorySlug: 'fashion',
      brandSlug: 'aura-lifestyle',
      description: 'Crafted from 100% breathable organic French linen. Tailored with a relaxed modern fit, mandarin collar, and mother-of-pearl buttons.',
      highlights: ['100% Breathable Organic Linen', 'Pre-washed for Ultra Soft Feel', 'Relaxed Contemporary Fit', 'Ideal for Indian Climates'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Signature Supima Cotton Heavyweight T-Shirt',
      slug: 'signature-supima-cotton-tshirt',
      sku: 'FAS-TSH-009',
      price: 799,
      mrp: 1499,
      stock: 100,
      categorySlug: 'fashion',
      brandSlug: 'pick2buy-signature',
      description: '240 GSM dense Supima cotton providing superior drape, zero shrinkage, and double-stitched collar that retains its shape wash after wash.',
      highlights: ['240 GSM Premium Supima Cotton', 'Anti-Pilling & Pre-Shrunk Fabric', 'Drop Shoulder Relaxed Fit', 'Bio-Washed Silky Handfeel'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Stretch Comfort Everyday Chino Trousers',
      slug: 'stretch-comfort-everyday-chino-trousers',
      sku: 'FAS-TRO-010',
      price: 1399,
      mrp: 2799,
      stock: 35,
      categorySlug: 'fashion',
      brandSlug: 'aura-lifestyle',
      description: 'Cotton-elastane twill blend engineered with flexible 4-way stretch, deep utility pockets, and tapered ankle for effortless office-to-evening style.',
      highlights: ['4-Way Performance Stretch', 'Moisture-Wicking Cotton Twill', 'Reinforced Pocket Stitching', 'Tailored Modern Slim Fit'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Handcrafted Chikankari Embroidered Kurta',
      slug: 'handcrafted-chikankari-embroidered-kurta',
      sku: 'FAS-KUR-011',
      price: 1899,
      mrp: 3999,
      stock: 25,
      categorySlug: 'fashion',
      brandSlug: 'aura-lifestyle',
      description: 'Authentic Lucknowi hand embroidery on fine lightweight cotton cambric. Perfect festive statement for family gatherings and celebrations.',
      highlights: ['Authentic Lucknowi Hand Embroidery', 'Pure Soft Cambric Cotton', 'Elegant Knee-Length Cut', 'Includes Matching Pocket Detail'],
      isFeatured: true,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'All-Weather Packable Windbreaker Jacket',
      slug: 'all-weather-packable-windbreaker-jacket',
      sku: 'FAS-JAC-012',
      price: 1999,
      mrp: 4199,
      stock: 18,
      categorySlug: 'fashion',
      brandSlug: 'urbanfit',
      description: 'Ultralight ripstop nylon with DWR water-repellent coating. Packs into its own compact pocket for convenient travel during monsoons and breezy evenings.',
      highlights: ['Water Repellent DWR Coating', 'Packs into Internal Pouch', 'Adjustable Hood and Hem', 'Reflective Safety Elements'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
    },
    // Footwear (4)
    {
      name: 'CloudStride Pro Lightweight Running Shoes',
      slug: 'cloudstride-pro-running-shoes',
      sku: 'FTW-SH-013',
      price: 2299,
      mrp: 4999,
      stock: 35,
      categorySlug: 'footwear',
      brandSlug: 'urbanfit',
      description: 'High-rebound nitrogen-infused foam midsole absorbs road impact while breathable mesh upper ensures exceptional airflow during 10K runs.',
      highlights: ['Nitrogen-Infused Energy Foam', 'Seamless Engineered Air-Mesh', 'Anti-Slip Grippy Carbon Rubber Outsole', 'Weighs only 240g per shoe'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Classic Full-Grain Handcrafted Leather Loafers',
      slug: 'classic-full-grain-leather-loafers',
      sku: 'FTW-LOA-014',
      price: 2799,
      mrp: 5999,
      stock: 20,
      categorySlug: 'footwear',
      brandSlug: 'aura-lifestyle',
      description: 'Supple genuine full-grain leather with cushioned memory foam insole and durable Goodyear welted construction for corporate sophistication.',
      highlights: ['100% Genuine Full-Grain Leather', 'Triple Density Memory Cushion Footbed', 'Hand-Stitched Penny Apron', 'Slip-Resistant Rubber Heel'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'UrbanGlider Minimalist White Leather Sneakers',
      slug: 'urbanglider-white-leather-sneakers',
      sku: 'FTW-SNK-015',
      price: 1999,
      mrp: 3899,
      stock: 45,
      categorySlug: 'footwear',
      brandSlug: 'pick2buy-signature',
      description: 'Timeless clean silhouette crafted from microfiber leather with antimicrobial lining and vulcanized rubber sole for day-long street comfort.',
      highlights: ['Easy-Clean Microfiber Leather', 'Orthopedic Arch Support Insole', 'Vulcanized Flexible Rubber Cupsole', 'Versatile Minimalist Styling'],
      isFeatured: true,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'EcoComfort Ortho Slides & Recovery Slippers',
      slug: 'ecocomfort-ortho-recovery-slides',
      sku: 'FTW-SLI-016',
      price: 699,
      mrp: 1499,
      stock: 85,
      categorySlug: 'footwear',
      brandSlug: 'urbanfit',
      description: 'Ultra-cushioned EVA cloud foam relieves plantar fasciitis foot tension after long workouts and walks. Water-resistant and anti-skid bottom.',
      highlights: ['Deep Heel Cup & Arch Alignment', 'Soft High-Density EVA Foam', 'Waterproof & Easy to Wash', 'Anti-Slip Textured Tread'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&auto=format&fit=crop&q=80',
    },
    // Home & Kitchen (4)
    {
      name: 'ThermoLock 900ml Vacuum Insulated Tumbler',
      slug: 'thermolock-vacuum-insulated-tumbler',
      sku: 'HOM-TUM-017',
      price: 899,
      mrp: 1899,
      stock: 65,
      categorySlug: 'home-kitchen',
      brandSlug: 'zenith-living',
      description: 'Food-grade 18/8 stainless steel double-wall vacuum keeps drinks iced for 24 hours or piping hot for 12 hours. Includes leak-proof lid and metal straw.',
      highlights: ['Double Wall Vacuum Insulation', '18/8 Food Grade Stainless Steel', 'Sweat-Proof Powder Coated Grip', 'Fits Standard Car Cup Holders'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'ChefMaster 4.5L Digital Air Fryer 1400W',
      slug: 'chefmaster-digital-air-fryer',
      sku: 'HOM-AFR-018',
      price: 3899,
      mrp: 7999,
      stock: 22,
      categorySlug: 'home-kitchen',
      brandSlug: 'zenith-living',
      description: 'Enjoy guilt-free crispy samosas, fries, and tikkas with 85% less oil using 360-degree rapid air vortex heating with 8 preset digital cooking programs.',
      highlights: ['85% Less Oil Rapid Air Vortex', '8 One-Touch Digital Presets', 'Non-Stick Dishwasher Safe Basket', 'Auto Shut-Off Overheat Protection'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'AromaZen Ultrasonic Essential Oil Diffuser',
      slug: 'aromazen-ultrasonic-essential-oil-diffuser',
      sku: 'HOM-DIF-019',
      price: 1199,
      mrp: 2499,
      stock: 40,
      categorySlug: 'home-kitchen',
      brandSlug: 'zenith-living',
      description: '500ml ultrasonic mist humidifier creates a soothing spa sanctuary with 7 gentle LED ambient colors, whisper-quiet operation and timer controls.',
      highlights: ['500ml Capacity up to 10 Hours', 'Whisper Quiet < 23dB Operation', '7 Calming Ambient LED Glows', 'Waterless Automatic Shut-off'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'PurePour Handcrafted Pour-Over Coffee Maker Set',
      slug: 'purepour-handcrafted-coffee-maker-set',
      sku: 'HOM-COF-020',
      price: 1499,
      mrp: 2999,
      stock: 28,
      categorySlug: 'home-kitchen',
      brandSlug: 'zenith-living',
      description: 'Borosilicate glass carafe with permanent double-layer stainless steel mesh filter eliminates paper waste while capturing rich artisanal coffee oils.',
      highlights: ['Heat-Resistant Borosilicate Glass', 'Reusable Micro-Mesh Metal Filter', 'Wooden Collar with Real Leather Tie', '600ml 4-Cup Capacity'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    },
    // Health & Fitness (3)
    {
      name: 'ProRelief Deep Tissue Percussion Massage Gun',
      slug: 'prorelief-deep-tissue-massage-gun',
      sku: 'FIT-MSG-021',
      price: 2499,
      mrp: 5999,
      stock: 30,
      categorySlug: 'health-fitness',
      brandSlug: 'urbanfit',
      description: 'Brushless high-torque motor delivers 3200 RPM percussions to melt muscle knots, speed recovery, and relieve lower back soreness. Includes 6 custom heads.',
      highlights: ['30 Speed Levels up to 3200 RPM', '6 Specialized Ergonomic Heads', 'Whisper-Quiet Brushless Motor', 'Up to 6 Hours Battery Runtime'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'ZenMat Extra Thick 8mm TPE Yoga Mat',
      slug: 'zenmat-extra-thick-tpe-yoga-mat',
      sku: 'FIT-MAT-022',
      price: 1099,
      mrp: 2299,
      stock: 50,
      categorySlug: 'health-fitness',
      brandSlug: 'urbanfit',
      description: 'Dual-sided non-slip laser-textured eco TPE foam provides knee cushioning, body alignment lines, and sweat resistance. Includes carry strap.',
      highlights: ['Eco-Friendly Non-Toxic TPE Foam', 'Dual-Color Non-Slip Textures', 'Body Alignment Laser Guide Lines', 'Free Shoulder Carrying Strap'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'FlexCore Resistance Loop Bands Set of 5',
      slug: 'flexcore-resistance-bands-set',
      sku: 'FIT-BND-023',
      price: 499,
      mrp: 1299,
      stock: 90,
      categorySlug: 'health-fitness',
      brandSlug: 'urbanfit',
      description: '100% natural Malaysian latex bands in 5 color-coded resistance levels from X-Light (5 lbs) to X-Heavy (40 lbs) for glute, leg, and strength training.',
      highlights: ['100% Natural Snap-Proof Latex', '5 Progressive Resistance Levels', 'Compact Travel Pouch Included', 'Full Body Exercise Illustrated Guide'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop&q=80',
    },
    // Beauty & Personal Care (3)
    {
      name: 'GlowRevive 10% Vitamin C Serum 30ml',
      slug: 'glowrevive-vitamin-c-serum',
      sku: 'BEA-SER-024',
      price: 599,
      mrp: 1299,
      stock: 75,
      categorySlug: 'beauty-personal-care',
      brandSlug: 'zenith-living',
      description: 'Potent antioxidant formulation with 10% Ethyl Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid fades dark spots and boosts natural luminosity.',
      highlights: ['Fades Dark Spots & Hyperpigmentation', 'Hyaluronic Acid Hydration Boost', 'Paraben & Sulphate Free Clean Formula', 'Dermatologically Tested for Indian Skin'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'PrecisionPro Waterproof Beard & Hair Trimmer',
      slug: 'precisionpro-waterproof-beard-trimmer',
      sku: 'BEA-TRM-025',
      price: 1399,
      mrp: 2999,
      stock: 35,
      categorySlug: 'beauty-personal-care',
      brandSlug: 'pick2buy-signature',
      description: 'Self-sharpening titanium-coated blades with 40 length settings (0.5mm to 20mm), fast Type-C charging, and 90-minute cordless run time.',
      highlights: ['40 Precision Length Settings', 'Self-Sharpening Titanium Blades', 'IPX7 100% Washable Body', '90 Minutes Run Time on Single Charge'],
      isFeatured: false,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Organic Cold-Pressed Moroccan Argan Oil 100ml',
      slug: 'organic-cold-pressed-argan-oil',
      sku: 'BEA-OIL-026',
      price: 849,
      mrp: 1699,
      stock: 45,
      categorySlug: 'beauty-personal-care',
      brandSlug: 'aura-lifestyle',
      description: '100% pure virgin Moroccan argan oil rich in Vitamin E and essential fatty acids. Deeply nourishes dry hair, tames frizz, and hydrates skin.',
      highlights: ['100% Certified Organic & Cold-Pressed', 'Intense Frizz Control & Hair Shine', 'Non-Greasy Fast Absorbing Texture', 'Multipurpose Hair, Beard & Skin Oil'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1608248597359-59754b2efc8f?w=800&auto=format&fit=crop&q=80',
    },
    // Office & Stationery (4)
    {
      name: 'ErgoComfort Memory Foam Lumbar Support Cushion',
      slug: 'ergocomfort-lumbar-support-cushion',
      sku: 'OFF-CUS-027',
      price: 999,
      mrp: 2199,
      stock: 55,
      categorySlug: 'office-stationery',
      brandSlug: 'zenith-living',
      description: 'High-density orthopedic memory foam ergonomically contoured to cradle the spine, reduce lumbar pressure, and promote healthy posture at your desk.',
      highlights: ['Orthopedic Spinal Contour Ergonomics', 'High-Density Non-Flattening Foam', 'Breathable 3D Mesh Removable Cover', 'Dual Adjustable Buckle Straps'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Vegan Leather Executive Desk Mat 90x40cm',
      slug: 'vegan-leather-executive-desk-mat',
      sku: 'OFF-MAT-028',
      price: 749,
      mrp: 1599,
      stock: 80,
      categorySlug: 'office-stationery',
      brandSlug: 'pick2buy-signature',
      description: 'Double-sided waterproof PU leather mat protects your desk from scratches and spills while providing an ultra-smooth glide for optical mice.',
      highlights: ['Dual-Tone Reversible Design', 'Waterproof & Easy Wipe Clean', 'Smooth Optical Mouse Tracking', 'Extra Large 90x40cm Surface'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: true,
      isFlashDeal: true,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Aluminum Foldable Ergonomic Laptop Stand',
      slug: 'aluminum-foldable-laptop-stand',
      sku: 'OFF-LST-029',
      price: 899,
      mrp: 1999,
      stock: 60,
      categorySlug: 'office-stationery',
      brandSlug: 'pick2buy-signature',
      description: 'Sturdy aerospace aluminum alloy with 6 height adjustment angles (15° to 45°). Promotes eye-level screen height and active airflow cooling.',
      highlights: ['6 Adjustable Ergonomic Angles', 'Aerospace Grade Sturdy Aluminum', 'Silicone Anti-Scratch Pads', 'Compact Foldable with Felt Sleeve'],
      isFeatured: true,
      isBestSeller: true,
      isTrending: true,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Artisan Hardcover Dotted Grid Journal 160 GSM',
      slug: 'artisan-hardcover-dotted-grid-journal',
      sku: 'OFF-JOU-030',
      price: 549,
      mrp: 1199,
      stock: 40,
      categorySlug: 'office-stationery',
      brandSlug: 'aura-lifestyle',
      description: 'Heavyweight 160 GSM bamboo paper resists fountain pen bleeding and ghosting. Features lay-flat binding, dual bookmarks, and expanding back pocket.',
      highlights: ['160 GSM Ultra-Thick Bleedproof Paper', '180° Lay-Flat Thread Binding', 'Subtle 5mm Dotted Grid', 'Expandable Rear Storage Pocket'],
      isFeatured: false,
      isBestSeller: false,
      isTrending: false,
      isFlashDeal: false,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsList) {
    const category = createdCategories[p.categorySlug];
    const brand = createdBrands[p.brandSlug];
    const discountPercentage = Math.round(((p.mrp - p.price) / p.mrp) * 100);

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        shortDescription: p.highlights[0] + ' • ' + p.highlights[1],
        price: p.price,
        mrp: p.mrp,
        costPrice: Math.round(p.price * 0.55),
        discountPercentage,
        stock: p.stock,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isTrending: p.isTrending,
        isFlashDeal: p.isFlashDeal,
        flashDealEnd: p.isFlashDeal ? new Date(Date.now() + 86400000 * 2) : null,
        highlights: JSON.stringify(p.highlights),
        specifications: JSON.stringify({
          Brand: brand.name,
          Warranty: '1 Year Pick2Buy Manufacturer Warranty',
          CountryOfOrigin: 'India',
          InTheBox: 'Main Unit, User Manual, Warranty Card',
        }),
        categoryId: category.id,
        brandId: brand.id,
        images: {
          create: [
            {
              url: p.imageUrl,
              altText: p.name,
              isPrimary: true,
              displayOrder: 0,
            },
            {
              url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
              altText: `${p.name} Angle View`,
              isPrimary: false,
              displayOrder: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              sku: `${p.sku}-STD`,
              name: 'Standard Edition',
              price: p.price,
              mrp: p.mrp,
              stock: p.stock,
              color: 'Midnight Slate',
            },
          ],
        },
      },
    });
    createdProducts.push(product);
  }

  console.log(`✅ 30 Products across 8 Categories seeded.`);

  // 6. 5 Realistic Coupons
  const couponsData = [
    { code: 'WELCOME10', description: 'Flat 10% off for all new shoppers', type: 'PERCENTAGE', value: 10, minOrderValue: 499, maxDiscount: 500, isFirstOrderOnly: true },
    { code: 'PICK2BUY100', description: 'Flat ₹100 discount on orders above ₹999', type: 'FIXED', value: 100, minOrderValue: 999, isFirstOrderOnly: false },
    { code: 'FESTIVE20', description: 'Festive Season 20% discount', type: 'PERCENTAGE', value: 20, minOrderValue: 1499, maxDiscount: 1000, isFirstOrderOnly: false },
    { code: 'FREESHIP', description: 'Free shipping on any order size', type: 'FREE_SHIPPING', value: 49, minOrderValue: 0, isFirstOrderOnly: false },
    { code: 'TECHDEAL', description: 'Extra ₹250 off on Electronics and Gadgets', type: 'FIXED', value: 250, minOrderValue: 1999, isFirstOrderOnly: false },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount || null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isActive: true,
        isFirstOrderOnly: c.isFirstOrderOnly,
      },
    });
  }

  // 7. 5 Product Reviews
  const reviewsData = [
    {
      productIndex: 0,
      customerIndex: 0,
      rating: 5,
      title: 'Incredible sound clarity and noise cancelling!',
      comment: 'The ANC on these earbuds is genuinely on par with top-tier brands. Fast delivery within 2 days to Mumbai. Extremely impressed with Pick2Buy service!',
    },
    {
      productIndex: 1,
      customerIndex: 1,
      rating: 5,
      title: 'Best AMOLED smartwatch in this price segment',
      comment: 'Screen is bright and vibrant even in harsh sunlight. Calling works without static. Battery lasts easily 6-7 days.',
    },
    {
      productIndex: 7,
      customerIndex: 2,
      rating: 4,
      title: 'Super comfortable linen fabric',
      comment: 'Very soft handfeel and fits true to size. Looks elegant for office wear and Sunday brunches.',
    },
    {
      productIndex: 12,
      customerIndex: 3,
      rating: 5,
      title: 'Amazing cushioning for morning runs',
      comment: 'Feels like walking on clouds. Did a 5K on day one and zero foot fatigue. Definitely recommend Pick2Buy!',
    },
    {
      productIndex: 16,
      customerIndex: 4,
      rating: 5,
      title: 'Keeps ice frozen for over 24 hours',
      comment: 'High grade stainless steel, no metallic aftertaste. Great travel buddy for Bengaluru commutes.',
    },
  ];

  for (const r of reviewsData) {
    const prod = createdProducts[r.productIndex];
    const cust = createdCustomers[r.customerIndex];
    await prisma.review.create({
      data: {
        productId: prod.id,
        userId: cust.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: true,
        status: 'APPROVED',
        adminReply: 'Thank you for shopping with Pick2Buy! We are delighted that you love your purchase.',
      },
    });
  }

  // 8. 10 Sample Orders
  const orderStatuses = ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING', 'PENDING', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'CONFIRMED', 'DELIVERED'];
  for (let i = 0; i < 10; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const prod1 = createdProducts[i % createdProducts.length];
    const prod2 = createdProducts[(i + 3) % createdProducts.length];
    const status = orderStatuses[i];
    const orderNumber = `P2B-2026-80${i}42`;
    const subtotal = prod1.price + prod2.price;
    const shippingFee = subtotal > 499 ? 0 : 49;
    const grandTotal = subtotal + shippingFee;

    const shippingAddress = {
      fullName: cust.name,
      mobile: cust.phone,
      email: cust.email,
      addressLine: 'Apt 501, Silicon Heights, 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true,
      type: 'HOME',
    };

    await prisma.order.upsert({
      where: { orderNumber },
      update: {},
      create: {
        orderNumber,
        userId: cust.id,
        customerName: cust.name,
        customerEmail: cust.email,
        customerPhone: cust.phone,
        shippingAddressJson: JSON.stringify(shippingAddress),
        status,
        paymentMethod: i % 2 === 0 ? 'RAZORPAY_UPI' : 'COD',
        paymentStatus: status === 'PENDING' ? 'PENDING' : 'COMPLETED',
        paymentId: i % 2 === 0 ? `pay_rzp_demo_${i}` : null,
        trackingNumber: ['SHIPPED', 'DELIVERED'].includes(status) ? `BD${8829102 + i}IN` : null,
        courierName: 'Pick2Buy Express / BlueDart',
        subtotal,
        taxAmount: Math.round(subtotal * 0.18),
        shippingFee,
        discountAmount: 0,
        grandTotal,
        items: {
          create: [
            {
              productId: prod1.id,
              productName: prod1.name,
              sku: prod1.sku,
              price: prod1.price,
              quantity: 1,
              total: prod1.price,
            },
            {
              productId: prod2.id,
              productName: prod2.name,
              sku: prod2.sku,
              price: prod2.price,
              quantity: 1,
              total: prod2.price,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: 'PENDING', comment: 'Order placed' },
            { status: 'CONFIRMED', comment: 'Payment verified' },
            ...(status === 'DELIVERED'
              ? [
                  { status: 'SHIPPED', comment: 'Dispatched via BlueDart' },
                  { status: 'DELIVERED', comment: 'Delivered to customer' },
                ]
              : []),
          ],
        },
      },
    });
  }

  // 9. CRM Leads Pipeline
  const leadsData = [
    { name: 'Sameer Kapoor', email: 'sameer.k@example.com', phone: '9811223344', source: 'GOOGLE_SEARCH', productInterest: 'Bulk Corporate Wireless Earbuds', status: 'QUALIFIED', estimatedValue: 45000, notes: 'Requires 30 units for corporate gifting' },
    { name: 'Meera Nambiar', email: 'meera.n@example.com', phone: '9845332211', source: 'INSTAGRAM_AD', productInterest: 'Pure Linen Shirts Collection', status: 'NEW', estimatedValue: 12000, notes: 'Interested in wholesale samples' },
    { name: 'Deepak Joshi', email: 'deepak.j@example.com', phone: '9820554433', source: 'WEBSITE_CHAT', productInterest: 'Digital Air Fryers & Kitchen Appliances', status: 'CONTACTED', estimatedValue: 8000, notes: 'Sent brochure and pricing sheet' },
    { name: 'Sunita Rao', email: 'sunita.rao@example.com', phone: '9876998877', source: 'REFERRAL', productInterest: 'Ergonomic Desk Accessories & Laptop Stands', status: 'CONVERTED', estimatedValue: 28000, notes: 'Converted to regular B2B buyer' },
    { name: 'Rajesh Nair', email: 'rajesh.nair@example.com', phone: '9895114422', source: 'FACEBOOK', productInterest: 'Smartwatches', status: 'LOST', estimatedValue: 5000, notes: 'Budget constraints' },
  ];

  for (const l of leadsData) {
    await prisma.lead.create({
      data: {
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        productInterest: l.productInterest,
        status: l.status,
        estimatedValue: l.estimatedValue,
        notes: l.notes,
      },
    });
  }

  // 10. Support Tickets
  const ticketData = [
    {
      ticketNumber: 'TKT-1001',
      customerId: createdCustomers[0].id,
      subject: 'Inquiry regarding shipment delivery time to Mumbai',
      description: 'Hi Pick2Buy team, can I confirm if my order will be delivered by tomorrow afternoon?',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      message: 'Hello Aarav, your order has been dispatched via BlueDart Air and is scheduled for delivery before 2 PM tomorrow.',
    },
    {
      ticketNumber: 'TKT-1002',
      customerId: createdCustomers[1].id,
      subject: 'Size exchange for Linen Mandarin Shirt',
      description: 'I received size M but would like to exchange for size L for a more relaxed fit.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      message: 'Hello Priya, our courier partner has been scheduled to pick up size M and hand over size L simultaneously.',
    },
  ];

  for (const t of ticketData) {
    await prisma.supportTicket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {},
      create: {
        ticketNumber: t.ticketNumber,
        customerId: t.customerId,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        messages: {
          create: [
            {
              senderId: admin.id,
              message: t.message,
            },
          ],
        },
      },
    });
  }

  // 11. Banners & Homepage Sections
  const banners = [
    {
      title: 'Upgrade Your Lifestyle with Pick2Buy',
      subtitle: 'Exclusive discounts up to 60% on premium audio, smartwatches & essentials',
      desktopImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      buttonText: 'Explore Collection',
      linkUrl: '/shop',
      displayOrder: 0,
      isActive: true,
    },
    {
      title: 'Sound That Moves You: SonicBlast Pro',
      subtitle: 'Hybrid Active Noise Cancellation with 36 hours of playtime. Limited flash deal.',
      desktopImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
      buttonText: 'Shop Gadgets',
      linkUrl: '/category/electronics',
      displayOrder: 1,
      isActive: true,
    },
  ];

  for (const b of banners) {
    await prisma.banner.create({ data: b });
  }

  const homepageSections = [
    { sectionKey: 'hero', title: 'Hero Carousel', isEnabled: true, displayOrder: 0 },
    { sectionKey: 'trust_badges', title: 'Trust Badges & Guarantees', isEnabled: true, displayOrder: 1 },
    { sectionKey: 'categories', title: 'Explore Top Categories', isEnabled: true, displayOrder: 2 },
    { sectionKey: 'flash_sale', title: 'Flash Deals — Ends In', isEnabled: true, displayOrder: 3 },
    { sectionKey: 'trending', title: 'Trending Products This Week', isEnabled: true, displayOrder: 4 },
    { sectionKey: 'promo_banner', title: 'Mid-Season Feature Banner', isEnabled: true, displayOrder: 5 },
    { sectionKey: 'best_sellers', title: 'Pick2Buy Best Sellers', isEnabled: true, displayOrder: 6 },
    { sectionKey: 'testimonials', title: 'Loved by 50,000+ Happy Customers', isEnabled: true, displayOrder: 7 },
    { sectionKey: 'newsletter', title: 'Join the Pick2Buy Insider Club', isEnabled: true, displayOrder: 8 },
  ];

  for (const s of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: s.sectionKey },
      update: {},
      create: s,
    });
  }

  console.log('🎉 Seeding successfully completed! Pick2Buy is ready for live full-stack demo.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
