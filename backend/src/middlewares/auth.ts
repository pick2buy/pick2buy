import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { ROLES, UserRoleType } from '@pick2buy/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { id: string; role: string; tokenVersion?: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, tokenVersion: true },
    });

    if (user && (payload.tokenVersion ?? 0) === user.tokenVersion) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRoleType,
      };
    }
  } catch (err) {
    // Expired or invalid token, pass through as unauthenticated
  }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
  }
  next();
};

export const requireRole = (allowedRoles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions',
      });
    }
    next();
  };
};

export const requireAdmin = requireRole([ROLES.ADMIN, ROLES.MANAGER]);
export const requireStaff = requireRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.SUPPORT_AGENT]);
