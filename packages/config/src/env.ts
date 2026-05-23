import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('devops-ai-platform'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  GITHUB_TOKEN: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  JIRA_HOST: z.string().url().optional(),
  JIRA_EMAIL: z.string().email().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_PROJECT_KEY: z.string().optional(),

  MCP_SERVER_PORT: z.coerce.number().default(5000),
  MCP_AUTH_SECRET: z.string().min(16).optional(),
  MCP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  REDIS_URL: z.string().optional(),

  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  ENCRYPTION_KEY: z.string().min(32).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return result.data;
}

export function getEnvConfig(): EnvConfig {
  return validateEnv(process.env as Record<string, string | undefined>);
}

export const isDevelopment = () => process.env['NODE_ENV'] === 'development';
export const isProduction = () => process.env['NODE_ENV'] === 'production';
export const isTest = () => process.env['NODE_ENV'] === 'test';
