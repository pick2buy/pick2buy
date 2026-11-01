import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { requireAuth, requireStaff } from '../middlewares/auth';
import { PaymentService } from '../lib/payment';

const router = Router();

router.get('/payment-options', (_req, res) => res.json({ success: true, data: { onlineAvailable: PaymentService.isConfigured() } }));
router.get('/wallet', requireAuth, OrderController.getWallet);
router.post('/wallet/:userId/adjust', requireStaff, OrderController.adjustWallet);

router.post('/checkout', requireAuth, OrderController.checkout);
router.post('/verify-payment', OrderController.verifyPayment);
router.get('/', requireAuth, OrderController.getOrders);
router.get('/returns', requireStaff, OrderController.getReturnRequests);
router.patch('/returns/:requestId', requireStaff, OrderController.updateReturnRequest);
router.post('/:orderId/returns', requireAuth, OrderController.requestReturn);
router.get('/:orderNumber', OrderController.getOrderByNumber);
router.post('/:orderId/cancel', requireAuth, OrderController.cancelOrder);
router.put('/:orderId/status', requireStaff, OrderController.updateOrderStatus);

export default router;
