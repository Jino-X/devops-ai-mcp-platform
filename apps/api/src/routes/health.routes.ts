import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const startTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  const uptime = Date.now() - startTime;

  let dbStatus: 'up' | 'down' = 'down';
  let dbLatency = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  const health = {
    status: dbStatus === 'up' ? 'healthy' : 'degraded',
    version: process.env['npm_package_version'] ?? '1.0.0',
    uptime,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latency: dbLatency,
        lastChecked: new Date().toISOString(),
      },
      redis: {
        status: 'unknown' as const,
        lastChecked: new Date().toISOString(),
      },
      github: {
        status: 'unknown' as const,
        lastChecked: new Date().toISOString(),
      },
      jira: {
        status: 'unknown' as const,
        lastChecked: new Date().toISOString(),
      },
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ live: true });
});

export { router as healthRouter };
