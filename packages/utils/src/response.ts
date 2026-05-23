import type { ApiResponse, ApiError, ApiMeta } from '@devops-ai/types';

export function successResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function errorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    code,
    message,
    details,
  };
}

export function sanitizeOutput<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'refreshToken']
): T {
  const sanitized = { ...obj };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
