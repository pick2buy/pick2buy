import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const googleAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', googleAuthLimiter, AuthController.google);
router.post('/google/link', googleAuthLimiter, requireAuth, AuthController.linkGoogle);
router.get('/me', requireAuth, AuthController.me);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
