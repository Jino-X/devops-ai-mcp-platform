import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const isOperational = err.isOperational ?? false;

  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors: validationErrors },
      },
    });
    return;
  }

  logger.error('Request error', err, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    statusCode,
    isOperational,
  });

  if (!isOperational && process.env['NODE_ENV'] === 'production') {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      details: err.details,
      ...(process.env['NODE_ENV'] !== 'production' && { stack: err.stack }),
    },
  });
}
