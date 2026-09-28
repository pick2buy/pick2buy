import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/check-pincode/:pincode', ProductController.checkDeliveryPincode);
router.get('/:slugOrId', ProductController.getProductBySlugOrId);

// Admin product endpoints
router.post('/', requireAdmin, ProductController.createProduct);
router.put('/:id', requireAdmin, ProductController.updateProduct);
router.delete('/:id', requireAdmin, ProductController.deleteProduct);

export default router;
