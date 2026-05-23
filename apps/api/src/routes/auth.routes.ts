import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', validate(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await authService.logoutAll(req.user!.userId);

    res.json({
      success: true,
      data: { message: 'All sessions revoked' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user!.userId,
      email: req.user!.email,
      role: req.user!.role,
      permissions: req.user!.permissions,
    },
  });
});

export { router as authRouter };
