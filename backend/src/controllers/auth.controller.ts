import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { EmailService } from '../lib/email';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, ROLES } from '@pick2buy/shared';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
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

      const { accessToken, refreshToken } = generateTokens(user);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Send welcome email asynchronously
      EmailService.sendWelcome(user.name, user.email).catch((err) =>
        console.error('[Auth] Failed to send welcome email:', err)
      );

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt.toISOString(),
          },
          accessToken,
        },
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

      const { accessToken, refreshToken } = generateTokens(user);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt.toISOString(),
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
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

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (user) {
        const resetToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: '1h' });
        await EmailService.sendPasswordReset(user.email, resetToken);
      }

      res.json({
        success: true,
        message: 'If an account exists with that email, password reset instructions have been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const payload = jwt.verify(token, config.jwt.secret) as { id: string };
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: payload.id },
        data: { passwordHash },
      });

      res.json({
        success: true,
        message: 'Password has been successfully updated. Please log in.',
      });
    } catch (error) {
      next(error);
    }
  }
}
