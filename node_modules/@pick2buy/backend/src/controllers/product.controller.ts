import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { productCreateSchema } from '@pick2buy/shared';
import { createAuditLog } from '../lib/audit';

export class ProductController {
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
          { name: { contains: query } },
          { description: { contains: query } },
          { sku: { contains: query } },
          { category: { name: { contains: query } } },
          { brand: { name: { contains: query } } },
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
            images: { orderBy: { displayOrder: 'asc' } },
            variants: true,
            category: true,
            brand: true,
            reviews: { select: { rating: true } },
          },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where }),
      ]);

      const formatted = products.map((p) => {
        const ratings = p.reviews.map((r) => r.rating);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.8;
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
        },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          variants: true,
          category: true,
          brand: true,
          reviews: {
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
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.8;

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

      // Calculate estimated delivery
      const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 3);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${days[deliveryDate.getDay()]}, ${deliveryDate.getDate()} ${months[deliveryDate.getMonth()]}`;

      res.json({
        success: true,
        data: {
          pincode,
          available: true,
          estimatedDeliveryDate: formattedDate,
          isCodAvailable: true,
          shippingFee: 0,
          courier: 'Pick2Buy Express / BlueDart / Delhivery',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = productCreateSchema.parse(req.body);
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

      const updated = await prisma.product.update({
        where: { id },
        data: req.body,
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

  public static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await prisma.product.delete({ where: { id } });

      await createAuditLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE_PRODUCT',
        resource: 'Product',
        resourceId: id,
        oldValue: existing,
      });

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
