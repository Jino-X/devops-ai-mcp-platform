import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requirePermissions } from '../middleware/auth.js';

const router = Router();

const listLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  toolName: z.string().optional(),
  status: z.enum(['pending', 'running', 'success', 'failed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

router.use(authenticate);

router.get(
  '/tools',
  requirePermissions('mcp:execute'),
  async (_req: Request, res: Response) => {
    const tools = [
      {
        name: 'get_github_repos',
        description: 'Fetch GitHub repositories for the authenticated user',
        category: 'github',
        requiredPermissions: ['github:read'],
      },
      {
        name: 'create_github_issue',
        description: 'Create a new issue in a GitHub repository',
        category: 'github',
        requiredPermissions: ['github:write'],
      },
      {
        name: 'get_pull_requests',
        description: 'Get pull requests for a repository',
        category: 'github',
        requiredPermissions: ['github:read'],
      },
      {
        name: 'create_jira_ticket',
        description: 'Create a new Jira ticket',
        category: 'jira',
        requiredPermissions: ['jira:write'],
      },
      {
        name: 'get_jira_issues',
        description: 'Get Jira issues for a project',
        category: 'jira',
        requiredPermissions: ['jira:read'],
      },
      {
        name: 'get_project_metrics',
        description: 'Get project analytics and metrics',
        category: 'analytics',
        requiredPermissions: ['logs:read'],
      },
      {
        name: 'fetch_logs',
        description: 'Fetch application logs',
        category: 'devops',
        requiredPermissions: ['logs:read'],
      },
      {
        name: 'deploy_app',
        description: 'Deploy an application to an environment',
        category: 'devops',
        requiredPermissions: ['deploy:execute'],
      },
      {
        name: 'restart_service',
        description: 'Restart a service in an environment',
        category: 'devops',
        requiredPermissions: ['deploy:execute'],
      },
      {
        name: 'get_users',
        description: 'Get list of users',
        category: 'users',
        requiredPermissions: ['users:read'],
      },
      {
        name: 'create_user',
        description: 'Create a new user',
        category: 'users',
        requiredPermissions: ['users:write'],
      },
    ];

    res.json({
      success: true,
      data: tools,
    });
  }
);

router.get(
  '/logs',
  requirePermissions('logs:read'),
  validate(listLogsSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, toolName, status, startDate, endDate } = req.query;

      const where: Record<string, unknown> = {};
      if (toolName) where['toolName'] = toolName;
      if (status) where['status'] = status;
      if (startDate || endDate) {
        where['createdAt'] = {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) }),
        };
      }

      const [logs, total] = await Promise.all([
        prisma.mCPToolLog.findMany({
          where,
          skip: ((page as number) - 1) * (limit as number),
          take: limit as number,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.mCPToolLog.count({ where }),
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

router.get(
  '/logs/:id',
  requirePermissions('logs:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await prisma.mCPToolLog.findUnique({
        where: { id: req.params['id'] },
      });

      if (!log) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Log not found' },
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
  }
);

router.get(
  '/stats',
  requirePermissions('logs:read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [totalExecutions, successCount, failureCount, toolStats] = await Promise.all([
        prisma.mCPToolLog.count(),
        prisma.mCPToolLog.count({ where: { status: 'success' } }),
        prisma.mCPToolLog.count({ where: { status: 'failed' } }),
        prisma.mCPToolLog.groupBy({
          by: ['toolName'],
          _count: { id: true },
          _avg: { duration: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalExecutions,
          successCount,
          failureCount,
          successRate: totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0,
          toolStats: toolStats.map((t: { toolName: string; _count: { id: number }; _avg: { duration: number | null } }) => ({
            toolName: t.toolName,
            executions: t._count.id,
            avgDuration: Math.round(t._avg.duration ?? 0),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as mcpRouter };
