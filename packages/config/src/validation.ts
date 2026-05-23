import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const uuidSchema = z.string().uuid('Invalid UUID');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.enum(['admin', 'developer', 'viewer', 'service']).default('developer'),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

export const createGitHubIssueSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1).max(256),
  body: z.string().max(65536).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

export const createJiraTicketSchema = z.object({
  projectKey: z.string().min(1).max(10),
  summary: z.string().min(1).max(256),
  description: z.string().max(32768).optional(),
  issueType: z.enum(['Bug', 'Task', 'Story', 'Epic']),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const deployAppSchema = z.object({
  appName: z.string().min(1).max(64),
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string().optional(),
  force: z.boolean().default(false),
});

export const restartServiceSchema = z.object({
  serviceName: z.string().min(1).max(64),
  environment: z.enum(['development', 'staging', 'production']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateGitHubIssueInput = z.infer<typeof createGitHubIssueSchema>;
export type CreateJiraTicketInput = z.infer<typeof createJiraTicketSchema>;
export type DeployAppInput = z.infer<typeof deployAppSchema>;
export type RestartServiceInput = z.infer<typeof restartServiceSchema>;
