import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { requireAuth, requireStaff } from '../middlewares/auth';

const router = Router();

router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/product/:productId', requireAuth, ReviewController.addReview);
router.put('/:reviewId/reply', requireStaff, ReviewController.respondToReview);

export default router;
