import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requirePermissions } from '../middleware/auth.js';

const router = Router();

const listLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  status: z.enum(['success', 'failure']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

router.use(authenticate);
router.use(requirePermissions('logs:read'));

router.get(
  '/',
  validate(listLogsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, userId, action, resource, status, startDate, endDate } = req.query;

      const where: Record<string, unknown> = {};
      if (userId) where['userId'] = userId;
      if (action) where['action'] = action;
      if (resource) where['resource'] = resource;
      if (status) where['status'] = status;
      if (startDate || endDate) {
        where['createdAt'] = {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) }),
        };
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: ((page as number) - 1) * (limit as number),
          take: limit as number,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / (limit as number)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalActions, successCount, failureCount, actionsByType, topUsers] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { status: 'success' } }),
      prisma.auditLog.count({ where: { status: 'failure' } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { id: true },
      }),
      prisma.auditLog.groupBy({
        by: ['userId', 'userEmail'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalActions,
        successCount,
        failureCount,
        actionsByType: Object.fromEntries(
          actionsByType.map((a: { action: string; _count: { id: number } }) => [a.action, a._count.id])
        ),
        topUsers: topUsers.map((u: { userId: string; userEmail: string; _count: { id: number } }) => ({
          userId: u.userId,
          userEmail: u.userEmail,
          actionCount: u._count.id,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: req.params['id'] },
    });

    if (!log) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Audit log not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

export { router as auditRouter };
