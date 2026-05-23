import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JWTPayload } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

export type Permission = string;

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_ERROR', message: 'No token provided' },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Invalid token', { error: (error as Error).message });
    res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid or expired token' },
    });
  }
}

export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' },
      });
      return;
    }

    const userPermissions = req.user.permissions;
    const hasAllPermissions = permissions.every(
      (p) => userPermissions.includes(p) || userPermissions.includes('admin:all')
    );

    if (!hasAllPermissions) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        required: permissions,
        actual: userPermissions,
      });
      res.status(403).json({
        success: false,
        error: { code: 'AUTHORIZATION_ERROR', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'AUTHORIZATION_ERROR', message: 'Role not authorized' },
      });
      return;
    }

    next();
  };
}
