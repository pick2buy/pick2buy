import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { productCreateSchema } from '@pick2buy/shared';
import { createAuditLog } from '../lib/audit';
import { z } from 'zod';
import { config } from '../config';
import { StorageError, uploadProductImage } from '../lib/supabaseStorage';

const productImageUrlSchema = z.string().refine(
  (value) => /^data:image\/(png|jpeg|webp);base64,/i.test(value) || z.string().url().safeParse(value).success,
  'Invalid image URL'
);
const productVariantSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  storage: z.string().optional(),
  price: z.number().min(0),
  mrp: z.number().min(0),
  stock: z.number().int().min(0),
  imageUrl: productImageUrlSchema.optional(),
});

const productUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  sku: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().min(1).nullable().optional(),
  price: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
  isTrending: z.boolean().optional(),
  isFlashDeal: z.boolean().optional(),
  imageUrl: productImageUrlSchema.optional().or(z.literal('')),
  images: z.array(z.object({
    url: productImageUrlSchema,
    altText: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).min(1).optional(),
  variants: z.array(productVariantSchema).optional(),
  sourcePlatform: z.enum(['OWN', 'MEESHO']).optional(),
  sourceProductCode: z.string().trim().min(1).max(120).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
}).strict();

const isMeeshoUrl = (value: string) => {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === 'meesho.com' || hostname.endsWith('.meesho.com');
  } catch {
    return false;
  }
};

const decodeHtml = (value: string) => value
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\u0026/g, '&')
  .replace(/<[^>]+>/g, '').trim();

const metadata = (html: string, property: string) => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
};

const parseMeeshoProduct = (html: string, sourceUrl: string) => {
  let jsonProduct: any = null;
  for (const raw of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(raw[1].trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed, ...(parsed?.['@graph'] || [])];
      jsonProduct = candidates.find((item: any) => item?.['@type'] === 'Product' || item?.['@type']?.includes?.('Product'));
      if (jsonProduct) break;
    } catch { /* Some page scripts are not valid JSON-LD. */ }
  }
  const imageValues = jsonProduct?.image || metadata(html, 'og:image');
  const images = (Array.isArray(imageValues) ? imageValues : [imageValues]).filter(Boolean).map(String);
  const price = Number(jsonProduct?.offers?.price || metadata(html, 'product:price:amount'));
  const name = decodeHtml(jsonProduct?.name || metadata(html, 'og:title') || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || 'Imported Meesho product');
  const description = decodeHtml(jsonProduct?.description || metadata(html, 'og:description') || name);
  const code = String(jsonProduct?.sku || jsonProduct?.mpn || sourceUrl.match(/p-([\w-]+)/i)?.[1] || `MEESHO-${Date.now()}`).slice(0, 80);
  return { name: name.slice(0, 180), description: description.slice(0, 5000), sourceUrl, sourceProductCode: code, supplierPrice: Number.isFinite(price) ? price : null, images: [...new Set(images)].slice(0, 12) };
};

export class ProductController {
  public static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = z.object({ image: z.string().min(1) }).parse(req.body).image;
      const url = await uploadProductImage(image);
      res.status(201).json({ success: true, data: { url } });
    } catch (error) {
      if (error instanceof StorageError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  public static async importMeeshoProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sourceUrl = z.string().url('Enter a valid Meesho product URL').parse(req.body?.url);
      if (!isMeeshoUrl(sourceUrl)) return res.status(400).json({ success: false, message: 'Use a valid meesho.com product URL' });
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          Referer: 'https://www.meesho.com/',
        },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      });
      if (response.status === 403) return res.status(422).json({ success: false, message: 'Meesho blocked automatic import for this listing. Add the product manually, or use a listing that permits import.' });
      if (!response.ok) return res.status(422).json({ success: false, message: `Meesho returned HTTP ${response.status}. Try another public product URL.` });
      const html = (await response.text()).slice(0, 4_000_000);
      const product = parseMeeshoProduct(html, response.url || sourceUrl);
      if (!product.name || product.name === 'Imported Meesho product') return res.status(422).json({ success: false, message: 'Product details are not publicly available at this URL.' });
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  public static async getAdminProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        // The edit form needs the complete variant list so saving another product
        // field does not silently replace the existing variants with an empty list.
        include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true, category: true, brand: true },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ success: true, data: products });
    } catch (error) { next(error); }
  }

  public static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        q,
        category,
        brand,
        minPrice,
        maxPrice,
        rating,
        inStock,
        featured,
        trending,
        bestSeller,
        flashDeal,
        sort = 'featured',
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const take = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * take;

      const where: any = {
        status: 'ACTIVE',
      };

      if (q) {
        const query = String(q).trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
        ];
      }

      if (category) {
        where.category = {
          OR: [{ slug: String(category) }, { id: String(category) }],
        };
      }

      if (brand) {
        where.brand = {
          OR: [{ slug: String(brand) }, { name: String(brand) }],
        };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice as string);
        if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
      }

      if (inStock === 'true') {
        where.stock = { gt: 0 };
      }

      if (featured === 'true') where.isFeatured = true;
      if (trending === 'true') where.isTrending = true;
      if (bestSeller === 'true') where.isBestSeller = true;
      if (flashDeal === 'true') where.isFlashDeal = true;

      // Determine sorting
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-low') orderBy = { price: 'asc' };
      else if (sort === 'price-high') orderBy = { price: 'desc' };
      else if (sort === 'newest') orderBy = { createdAt: 'desc' };
      else if (sort === 'bestseller') orderBy = { isBestSeller: 'desc' };
      else if (sort === 'featured') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            // Cards only render a primary image. Returning all gallery photos here
            // made the catalog response unnecessarily large.
            images: { orderBy: { displayOrder: 'asc' }, take: 1 },
            variants: true,
            category: true,
            brand: true,
            reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
          },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where }),
      ]);

      const formatted = products.map((p) => {
        const ratings = p.reviews.map((r) => r.rating);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return {
          ...p,
          averageRating: Number(avg.toFixed(1)),
          reviewCount: p.reviews.length,
          highlights: p.highlights ? JSON.parse(p.highlights) : [],
          specifications: p.specifications ? JSON.parse(p.specifications) : {},
        };
      });

      res.json({
        success: true,
        data: formatted,
        meta: {
          page: pageNum,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductBySlugOrId(req: Request, res: Response, next: NextFunction) {
    try {
      const { slugOrId } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          OR: [{ slug: slugOrId }, { id: slugOrId }],
          ...(!['ADMIN', 'MANAGER', 'STAFF', 'SUPPORT_AGENT'].includes(req.user?.role || '') ? { status: 'ACTIVE' } : {}),
        },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          variants: true,
          category: true,
          brand: true,
          reviews: {
            where: { status: 'APPROVED' },
            include: {
              user: { select: { name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Compute average rating
      const ratings = product.reviews.map((r) => r.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      // Find related products in same category
      const relatedProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          status: 'ACTIVE',
        },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          category: true,
        },
        take: 4,
      });

      res.json({
        success: true,
        data: {
          ...product,
          averageRating: Number(avg.toFixed(1)),
          reviewCount: product.reviews.length,
          highlights: product.highlights ? JSON.parse(product.highlights) : [],
          specifications: product.specifications ? JSON.parse(product.specifications) : {},
          relatedProducts,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async checkDeliveryPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const { pincode } = req.params;
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit Indian PIN code',
        });
      }

      res.json({
        success: true,
        data: {
          pincode,
          isCodPincodeAllowed: config.cod.enabled && !config.cod.restrictedPincodes.includes(pincode),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = productCreateSchema.parse(req.body);
      if (data.mrp < data.price) return res.status(400).json({ success: false, message: 'MRP cannot be lower than selling price' });
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const discountPercentage = data.mrp > data.price
        ? Math.round(((data.mrp - data.price) / data.mrp) * 100)
        : 0;

      const product = await prisma.product.create({
        data: {
          name: data.name,
          slug,
          sku: data.sku,
          description: data.description,
          shortDescription: data.shortDescription,
          sourcePlatform: data.sourcePlatform,
          sourceProductCode: data.sourceProductCode || null,
          sourceUrl: data.sourceUrl || null,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          price: data.price,
          mrp: data.mrp,
          costPrice: data.costPrice,
          discountPercentage,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold,
          status: data.status,
          isFeatured: data.isFeatured,
          isBestSeller: data.isBestSeller,
          isTrending: data.isTrending,
          isFlashDeal: data.isFlashDeal,
          highlights: JSON.stringify(data.highlights || []),
          specifications: JSON.stringify(data.specifications || {}),
          images: {
            create: data.images.map((img, idx) => ({
              url: img.url,
              altText: img.altText || data.name,
              isPrimary: img.isPrimary ?? idx === 0,
              displayOrder: idx,
            })),
          },
          variants: {
            create: data.variants.map((v) => ({
              sku: v.sku,
              name: v.name,
              size: v.size,
              color: v.color,
              material: v.material,
              storage: v.storage,
              price: v.price,
              mrp: v.mrp,
              stock: v.stock,
              imageUrl: v.imageUrl,
            })),
          },
        },
        include: {
          images: true,
          variants: true,
        },
      });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE_PRODUCT',
        resource: 'Product',
        resourceId: product.id,
        newValue: product,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const parsed = productUpdateSchema.parse(req.body);
      const sourcePlatform = parsed.sourcePlatform ?? existing.sourcePlatform;
      const sourceProductCode = parsed.sourceProductCode === undefined ? existing.sourceProductCode : parsed.sourceProductCode;
      const sourceUrl = parsed.sourceUrl === undefined ? existing.sourceUrl : parsed.sourceUrl;
      if (sourcePlatform === 'MEESHO' && !sourceProductCode && !sourceUrl) {
        return res.status(400).json({ success: false, message: 'Add the Meesho product code or listing URL' });
      }
      if (sourcePlatform === 'MEESHO' && sourceUrl && !isMeeshoUrl(sourceUrl)) {
        return res.status(400).json({ success: false, message: 'Use a meesho.com product URL' });
      }
      const { imageUrl, images, variants, ...data } = parsed;
      if (!Object.keys(data).length && imageUrl === undefined && images === undefined && variants === undefined) return res.status(400).json({ success: false, message: 'No product changes provided' });
      const price = data.price ?? existing.price;
      const mrp = data.mrp ?? existing.mrp;
      if (mrp < price) return res.status(400).json({ success: false, message: 'MRP cannot be lower than selling price' });
      const updated = await prisma.$transaction(async tx => {
        const result = await tx.product.update({ where: { id }, data: {
          ...data, discountPercentage: mrp > price ? Math.round((mrp - price) / mrp * 100) : 0,
        } });
        if (images) {
          await tx.productImage.deleteMany({ where: { productId: id } });
          await tx.productImage.createMany({ data: images.map((image, index) => ({
            productId: id,
            url: image.url,
            altText: image.altText || result.name,
            isPrimary: image.isPrimary ?? index === 0,
            displayOrder: index,
          })) });
        }
        if (variants !== undefined) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
          if (variants.length) await tx.productVariant.createMany({ data: variants.map(variant => ({
            productId: id,
            sku: variant.sku,
            name: variant.name,
            size: variant.size,
            color: variant.color,
            material: variant.material,
            storage: variant.storage,
            price: variant.price,
            mrp: variant.mrp,
            stock: variant.stock,
            imageUrl: variant.imageUrl,
          })) });
        }
        if (!images && imageUrl) {
          const firstImage = await tx.productImage.findFirst({ where: { productId: id }, orderBy: { displayOrder: 'asc' } });
          if (firstImage) await tx.productImage.update({ where: { id: firstImage.id }, data: { url: imageUrl, altText: result.name } });
          else await tx.productImage.create({ data: { productId: id, url: imageUrl, altText: result.name, isPrimary: true } });
        }
        return result;
      });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE_PRODUCT',
        resource: 'Product',
        resourceId: id,
        oldValue: existing,
        newValue: updated,
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async archiveProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'ARCHIVE_PRODUCT',
        resource: 'Product',
        resourceId: id,
        oldValue: existing,
      });

      res.json({
        success: true,
        message: 'Product archived successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({
        where: { id },
        include: { _count: { select: { orderItems: true } } },
      });
      if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
      if (existing._count.orderItems > 0) {
        return res.status(409).json({ success: false, message: 'This product has order history and cannot be deleted. Archive it instead.' });
      }

      await prisma.$transaction(async tx => {
        await tx.cartItem.deleteMany({ where: { productId: id } });
        await tx.wishlistItem.deleteMany({ where: { productId: id } });
        await tx.inventoryTransaction.deleteMany({ where: { productId: id } });
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
      });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE_PRODUCT',
        resource: 'Product',
        resourceId: id,
        oldValue: existing,
      });
      res.json({ success: true, message: 'Product deleted permanently' });
    } catch (error) {
      next(error);
    }
  }
}
