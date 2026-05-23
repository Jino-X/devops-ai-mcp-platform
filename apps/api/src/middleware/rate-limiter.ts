import rateLimit from 'express-rate-limit';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later',
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message } },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip ?? req.headers['x-forwarded-for']?.toString() ?? 'unknown';
    },
  });
}
