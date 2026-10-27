import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/check-pincode/:pincode', ProductController.checkDeliveryPincode);
router.post('/import-meesho', requireAdmin, ProductController.importMeeshoProduct);
router.post('/images', requireAdmin, ProductController.uploadImage);
router.get('/:slugOrId', ProductController.getProductBySlugOrId);

// Admin product endpoints
router.post('/', requireAdmin, ProductController.createProduct);
router.put('/:id', requireAdmin, ProductController.updateProduct);
router.put('/:id/archive', requireAdmin, ProductController.archiveProduct);
router.delete('/:id', requireAdmin, ProductController.deleteProduct);

export default router;
