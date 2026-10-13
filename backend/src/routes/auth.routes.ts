import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AddressController } from '../controllers/address.controller';
import { SupportController } from '../controllers/support.controller';
import { requireAuth } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const googleAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const emailCheckLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const passwordAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const recoveryRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false });
const recoveryVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

router.post('/check-email', emailCheckLimiter, AuthController.checkEmail);
router.post('/register', passwordAuthLimiter, AuthController.register);
router.post('/login', passwordAuthLimiter, AuthController.login);
router.post('/verify-code', otpLimiter, AuthController.verifyCode);
router.post('/resend-code', otpLimiter, AuthController.resendCode);
router.post('/google', googleAuthLimiter, AuthController.google);
router.post('/google/link', googleAuthLimiter, requireAuth, AuthController.linkGoogle);
router.get('/me', requireAuth, AuthController.me);
router.patch('/me', requireAuth, AuthController.updateProfile);
router.post('/me/addresses', requireAuth, AddressController.create);
router.patch('/me/addresses/:id', requireAuth, AddressController.update);
router.delete('/me/addresses/:id', requireAuth, AddressController.delete);
router.get('/me/tickets', requireAuth, SupportController.listMine);
router.post('/me/tickets', requireAuth, SupportController.create);
router.post('/change-email', recoveryRequestLimiter, requireAuth, AuthController.requestEmailChange);
router.post('/change-email/verify', recoveryVerifyLimiter, requireAuth, AuthController.confirmEmailChange);
router.post('/forgot-password', recoveryRequestLimiter, AuthController.forgotPassword);
router.post('/reset-password', recoveryVerifyLimiter, AuthController.resetPassword);

export default router;
