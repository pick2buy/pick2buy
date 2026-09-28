import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.put('/items/:itemId', CartController.updateItem);
router.delete('/items/:itemId', CartController.removeItem);
router.delete('/clear', CartController.clearCart);

export default router;
