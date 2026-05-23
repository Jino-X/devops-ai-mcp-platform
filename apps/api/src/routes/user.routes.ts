import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requirePermissions, requireRole } from '../middleware/auth.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.use(authenticate);

router.get(
  '/',
  requirePermissions('users:read'),
  validate(listUsersSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.list(req.query as Record<string, unknown>);

      res.json({
        success: true,
        data: result.users,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  requireRole('admin'),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.create(req.body);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.findById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive, ...allowedUpdates } = req.body;
    const user = await userService.update(req.user!.userId, allowedUpdates);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/me/change-password',
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );

      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  requirePermissions('users:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.findById(req.params['id']!);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  requirePermissions('users:write'),
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.update(req.params['id']!, req.body);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  requirePermissions('users:delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.delete(req.params['id']!);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as userRouter };
