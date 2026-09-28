import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/', requireAuth, WishlistController.getWishlist);
router.post('/toggle', requireAuth, WishlistController.toggleWishlist);
router.post('/move-to-cart', requireAuth, WishlistController.moveToCart);

export default router;
