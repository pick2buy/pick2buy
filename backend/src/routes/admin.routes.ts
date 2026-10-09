import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { ProductController } from '../controllers/product.controller';
import { CategoryController } from '../controllers/category.controller';
import { BrandController } from '../controllers/brand.controller';
import { requireAdmin, requireStaff } from '../middlewares/auth';

const router = Router();

// Dashboard & Analytics
router.get('/dashboard', requireStaff, AdminController.getDashboardMetrics);
router.get('/orders', requireStaff, AdminController.getOrders);
router.get('/products', requireStaff, ProductController.getAdminProducts);
router.get('/categories', requireStaff, CategoryController.getAdminCategories);
router.get('/brands', requireStaff, BrandController.list);
router.post('/brands', requireAdmin, BrandController.create);
router.put('/brands/:id', requireAdmin, BrandController.update);
router.delete('/brands/:id', requireAdmin, BrandController.remove);
router.get('/reports/:type', requireAdmin, AdminController.exportReport);

// Inventory
router.get('/inventory', requireStaff, AdminController.getInventory);
router.post('/inventory/adjust', requireStaff, AdminController.adjustStock);

// Customers & CRM
router.get('/customers', requireStaff, AdminController.getCustomers);
router.get('/leads', requireStaff, AdminController.getLeads);
router.post('/leads', requireStaff, AdminController.createLead);
router.put('/leads/:leadId/status', requireStaff, AdminController.updateLeadStatus);

// Support
router.get('/tickets', requireStaff, AdminController.getSupportTickets);
router.post('/tickets/:ticketId/reply', requireStaff, AdminController.replySupportTicket);

// Coupons
router.get('/coupons', requireStaff, AdminController.getCoupons);
router.post('/coupons', requireAdmin, AdminController.createCoupon);
router.delete('/coupons/:id', requireAdmin, AdminController.deleteCoupon);

// Banners & Homepage Builder
router.get('/banners', requireStaff, AdminController.getBanners);
router.post('/banners', requireAdmin, AdminController.createBanner);
router.put('/banners/:id', requireAdmin, AdminController.updateBanner);
router.delete('/banners/:id', requireAdmin, AdminController.deleteBanner);

router.get('/homepage-sections', AdminController.getHomepageSections);
router.put('/homepage-sections/:id', requireAdmin, AdminController.updateHomepageSection);

// Audit logs
router.get('/audit-logs', requireAdmin, AdminController.getAuditLogs);

export default router;
