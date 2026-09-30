import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { requireAuth, requireStaff } from '../middlewares/auth';
import { PaymentService } from '../lib/payment';

const router = Router();

router.get('/payment-options', (_req, res) => res.json({ success: true, data: { onlineAvailable: PaymentService.isConfigured() } }));

router.post('/checkout', OrderController.checkout);
router.post('/verify-payment', OrderController.verifyPayment);
router.get('/', requireAuth, OrderController.getOrders);
router.get('/:orderNumber', OrderController.getOrderByNumber);
router.put('/:orderId/status', requireStaff, OrderController.updateOrderStatus);

export default router;
