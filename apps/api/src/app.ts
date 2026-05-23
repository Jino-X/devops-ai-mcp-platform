import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';

import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { rateLimiter } from './middleware/rate-limiter.js';

import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { githubRouter } from './routes/github.routes.js';
import { jiraRouter } from './routes/jira.routes.js';
import { mcpRouter } from './routes/mcp.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { auditRouter } from './routes/audit.routes.js';

import { logger } from './lib/logger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(requestId);
  app.use(
    pinoHttp({
      logger: logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );

  app.use('/api/v1/auth', rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), authRouter);
  app.use('/api/v1/users', rateLimiter(), userRouter);
  app.use('/api/v1/github', rateLimiter(), githubRouter);
  app.use('/api/v1/jira', rateLimiter(), jiraRouter);
  app.use('/api/v1/mcp', rateLimiter({ windowMs: 60 * 1000, max: 60 }), mcpRouter);
  app.use('/api/v1/audit', rateLimiter(), auditRouter);
  app.use('/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
