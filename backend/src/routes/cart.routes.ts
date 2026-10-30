import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/', CartController.getCart);
router.post('/items', requireAuth, CartController.addItem);
router.put('/items/:itemId', CartController.updateItem);
router.delete('/items/:itemId', CartController.removeItem);
router.delete('/clear', CartController.clearCart);

export default router;
