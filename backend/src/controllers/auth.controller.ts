import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { EmailService } from '../lib/email';
import { startAuthChallenge, resendAuthChallenge, consumeAuthChallenge } from '../lib/authChallenge';
import { z } from 'zod';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, ROLES } from '@pick2buy/shared';

const generateTokens = (user: { id: string; email: string; role: string; tokenVersion: number }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
    config.jwt.secret,
    { expiresIn: '7d' } // comfortable session for smooth testing & dev
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

const googleClient = new OAuth2Client();
const isUploadedAvatar = (avatarUrl: string | null) => Boolean(avatarUrl?.startsWith('data:image/'));

async function verifyGoogleCredential(credential: unknown) {
  if (!config.googleClientId) {
    throw Object.assign(new Error('Google sign-in is not configured'), { statusCode: 503 });
  }
  if (typeof credential !== 'string' || !credential || credential.length > 10000) {
    throw Object.assign(new Error('Invalid Google credential'), { statusCode: 400 });
  }
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error('Google account has no verified email');
    }
    return { sub: payload.sub, email: payload.email.toLowerCase().trim(), name: payload.name || payload.email.split('@')[0], avatarUrl: payload.picture || null };
  } catch (error: any) {
    if (error?.code === 'EACCES' || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('Failed to retrieve verification certificates')) {
      console.error('[Auth] Google signing keys unavailable:', error?.message);
      throw Object.assign(new Error('Google sign-in is temporarily unavailable. Please try again shortly.'), { statusCode: 503 });
    }
    throw Object.assign(new Error('Google sign-in could not be verified'), { statusCode: 401 });
  }
}

export class AuthController {
  public static async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true },
      });
      res.json({ success: true, data: { exists: Boolean(user) } });
    } catch (error) { next(error); }
  }

  public static async google(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = await verifyGoogleCredential(req.body?.credential);
      let user = await prisma.user.findUnique({ where: { googleSub: identity.sub } });
      if (!user) {
        const existingEmail = await prisma.user.findUnique({ where: { email: identity.email } });
        if (existingEmail) {
          return res.status(409).json({ success: false, message: 'This email already has an account. Sign in with your password, then connect Google in your account profile.' });
        }
        try {
          user = await prisma.user.create({ data: {
            email: identity.email,
            name: identity.name,
            avatarUrl: identity.avatarUrl,
            googleSub: identity.sub,
            isEmailVerified: true,
            passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            role: ROLES.CUSTOMER,
            cart: { create: {} },
            wishlist: { create: {} },
          } });
        } catch (error: any) {
          // A concurrent sign-up must never attach Google to an unrelated email account.
          if (error?.code === 'P2002') return res.status(409).json({ success: false, message: 'An account already exists for this email. Please sign in and connect Google in your profile.' });
          throw error;
        }
      } else if (identity.avatarUrl && !isUploadedAvatar(user.avatarUrl) && user.avatarUrl !== identity.avatarUrl) {
        // Google profile-photo links can expire. Refresh only remotely hosted Google photos;
        // a photo uploaded in Pick2Buy remains the user's chosen profile image.
        user = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: identity.avatarUrl } });
      }
      const { accessToken, refreshToken } = generateTokens(user);
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
      res.json({ success: true, data: { user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, avatarUrl: user.avatarUrl, isEmailVerified: user.isEmailVerified,
        googleLinked: true, createdAt: user.createdAt.toISOString(),
      }, accessToken } });
    } catch (error) { next(error); }
  }

  public static async linkGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const identity = await verifyGoogleCredential(req.body?.credential);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
      if (identity.email !== user.email) {
        return res.status(400).json({ success: false, message: 'Choose the Google account with the same email as your Pick2Buy account.' });
      }
      if (user.googleSub && user.googleSub !== identity.sub) {
        return res.status(409).json({ success: false, message: 'A different Google account is already connected.' });
      }
      try {
        await prisma.user.update({ where: { id: user.id }, data: {
          googleSub: identity.sub, isEmailVerified: true,
          avatarUrl: isUploadedAvatar(user.avatarUrl) ? user.avatarUrl : identity.avatarUrl,
        } });
      } catch (error: any) {
        if (error?.code === 'P2002') return res.status(409).json({ success: false, message: 'That Google account is already connected to another user.' });
        throw error;
      }
      res.json({ success: true, message: 'Google account connected' });
    } catch (error) { next(error); }
  }

  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (existing) {
        if (!existing.isEmailVerified && await bcrypt.compare(data.password, existing.passwordHash)) {
          const pending = await startAuthChallenge(existing, 'SIGNUP');
          return res.json({ success: true, message: 'Verification code sent', data: pending });
        }
        return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
      }

      if (!EmailService.isConfigured) {
        throw Object.assign(new Error(config.nodeEnv === 'production'
          ? 'Email registration is temporarily unavailable. Please contact support.'
          : 'Email registration needs SMTP setup. Add a valid SMTP_PASSWORD to backend/.env.local, restart the backend, and use an email inbox you can access.'), { statusCode: 503 });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase().trim(),
          phone: data.phone || null,
          passwordHash,
          role: ROLES.CUSTOMER,
          cart: { create: {} },
          wishlist: { create: {} },
        },
      });

      const pending = await startAuthChallenge(user, 'SIGNUP');
      res.status(201).json({
        success: true,
        message: 'Verification code sent',
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await bcrypt.compare(data.password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const pending = await startAuthChallenge(user, user.isEmailVerified ? 'LOGIN' : 'SIGNUP');
      res.json({
        success: true,
        message: 'Verification code sent',
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId, code } = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).parse(req.body);
      const { user, purpose } = await consumeAuthChallenge(challengeId, code);
      const { accessToken, refreshToken } = generateTokens(user);
      const verified = await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, refreshToken },
      });
      if (purpose === 'SIGNUP') {
        EmailService.sendWelcome(user.name, user.email).catch(() => console.error('[Auth] Welcome email failed'));
      }
      res.json({ success: true, data: {
        user: {
          id: verified.id, name: verified.name, email: verified.email, phone: verified.phone,
          role: verified.role, avatarUrl: verified.avatarUrl, isEmailVerified: verified.isEmailVerified,
          googleLinked: Boolean(verified.googleSub), createdAt: verified.createdAt.toISOString(),
        },
        accessToken,
      } });
    } catch (error) { next(error); }
  }

  public static async resendCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId } = z.object({ challengeId: z.string().uuid() }).parse(req.body);
      const challenge = await prisma.authChallenge.findUnique({ where: { id: challengeId }, select: { purpose: true, userId: true } });
      if (challenge?.purpose === 'EMAIL_CHANGE' && challenge.userId !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Sign in to resend this code.' });
      }
      const pending = await resendAuthChallenge(challengeId);
      res.json({ success: true, message: 'A new verification code was sent', data: pending });
    } catch (error) { next(error); }
  }

  public static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isEmailVerified: user.isEmailVerified,
            googleLinked: Boolean(user.googleSub),
            dateOfBirth: user.dateOfBirth,
            addresses: user.addresses,
            createdAt: user.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = z.object({
        name: z.string().trim().min(2).max(80).optional(),
        phone: z.union([z.string().regex(/^[6-9]\d{9}$/), z.literal('')]).optional(),
        avatarUrl: z.string().max(280_000).nullable().optional(),
      }).strict().parse(req.body);
      if (!Object.keys(data).length) {
        return res.status(400).json({ success: false, message: 'No profile changes were provided.' });
      }
      if (typeof data.avatarUrl === 'string') {
        const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data.avatarUrl);
        if (!match) return res.status(400).json({ success: false, message: 'Please choose a PNG, JPEG, or WebP photo.' });
        const bytes = Buffer.from(match[2], 'base64');
        const isPng = match[1] === 'png' && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
        const isJpeg = match[1] === 'jpeg' && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
        const isWebp = match[1] === 'webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (bytes.length > 200_000 || !(isPng || isJpeg || isWebp)) {
          return res.status(400).json({ success: false, message: 'Photo must be a valid image under 200 KB.' });
        }
      }
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
      });
      res.json({ success: true, data: { user: {
        id: updated.id, name: updated.name, email: updated.email, phone: updated.phone,
        role: updated.role, avatarUrl: updated.avatarUrl, isEmailVerified: updated.isEmailVerified,
        googleLinked: Boolean(updated.googleSub), createdAt: updated.createdAt.toISOString(),
      } } });
    } catch (error) { next(error); }
  }

  public static async requestEmailChange(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().trim().email() }).strict().parse(req.body);
      const newEmail = email.toLowerCase();
      const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
      if (newEmail === user.email) return res.status(400).json({ success: false, message: 'This is already your account email.' });
      if (await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })) {
        return res.status(409).json({ success: false, message: 'This email is already linked to an account.' });
      }
      const pending = await startAuthChallenge(user, 'EMAIL_CHANGE', newEmail);
      res.json({ success: true, data: pending });
    } catch (error) { next(error); }
  }

  public static async confirmEmailChange(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId, code } = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict().parse(req.body);
      const challenge = await prisma.authChallenge.findUnique({ where: { id: challengeId } });
      if (!challenge || challenge.userId !== req.user!.id || challenge.purpose !== 'EMAIL_CHANGE' || !challenge.pendingEmail) {
        return res.status(400).json({ success: false, message: 'Email change request expired. Please start again.' });
      }
      const { pendingEmail } = await consumeAuthChallenge(challengeId, code, ['EMAIL_CHANGE']);
      const newEmail = pendingEmail!;
      if (await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })) {
        return res.status(409).json({ success: false, message: 'This email is already linked to an account.' });
      }
      const user = await prisma.user.update({ where: { id: req.user!.id }, data: { email: newEmail, isEmailVerified: true } });
      void EmailService.sendMail({
        to: req.user!.email,
        subject: 'Your Pick2Buy email address was changed',
        text: 'The email address on your Pick2Buy account was changed. If this was not you, contact Pick2Buy support immediately.',
        html: '<p>The email address on your Pick2Buy account was changed. If this was not you, contact Pick2Buy support immediately.</p>',
      }).catch(() => console.error('[Auth] Email change notice could not be sent'));
      res.json({ success: true, data: { user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, avatarUrl: user.avatarUrl, isEmailVerified: user.isEmailVerified,
        googleLinked: Boolean(user.googleSub), createdAt: user.createdAt.toISOString(),
      } } });
    } catch (error) {
      if ((error as any)?.code === 'P2002') return res.status(409).json({ success: false, message: 'This email is already linked to an account.' });
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      if (!EmailService.isConfigured) {
        throw Object.assign(new Error('Password recovery is temporarily unavailable. Please contact support.'), { statusCode: 503 });
      }
      const normalizedEmail = email.toLowerCase().trim();
      // Sending happens after the generic response so request timing does not reveal account existence.
      void (async () => {
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return;
        const existing = await prisma.authChallenge.findUnique({ where: { userId: user.id } });
        const now = new Date();
        if (existing?.purpose === 'RESET' && existing.expiresAt > now) {
          if (existing.lastSentAt.getTime() + 60_000 <= now.getTime()) {
            await resendAuthChallenge(existing.id);
          }
          return;
        }
        await startAuthChallenge(user, 'RESET');
      })().catch(() => console.error('[Auth] Password recovery email could not be sent'));
      res.json({
        success: true,
        message: 'If an account exists with that email, a verification code will be sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { authChallenge: true },
      });
      if (!user?.authChallenge || user.authChallenge.purpose !== 'RESET') {
        return res.status(400).json({ success: false, message: 'Incorrect or expired verification code.' });
      }
      await consumeAuthChallenge(user.authChallenge.id, code, ['RESET']);
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, refreshToken: null, tokenVersion: { increment: 1 } },
      });
      EmailService.sendMail({
        to: user.email,
        subject: 'Your Pick2Buy password was changed',
        text: 'Your Pick2Buy password was changed. If you did not make this change, contact support immediately.',
        html: '<p>Your Pick2Buy password was changed. If you did not make this change, contact support immediately.</p>',
      }).catch(() => console.error('[Auth] Password change notification could not be sent'));
      res.json({
        success: true,
        message: 'Password updated. Please sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
}
