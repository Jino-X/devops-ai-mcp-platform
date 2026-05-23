import type { Permission } from './auth.js';

export interface MCPTool {
  name: string;
  description: string;
  category: MCPToolCategory;
  requiredPermissions: Permission[];
  inputSchema: Record<string, unknown>;
  isEnabled: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export type MCPToolCategory =
  | 'github'
  | 'jira'
  | 'devops'
  | 'analytics'
  | 'users'
  | 'system';

export interface MCPToolExecution {
  id: string;
  toolName: string;
  userId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: MCPExecutionStatus;
  duration?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type MCPExecutionStatus = 'pending' | 'running' | 'success' | 'failed';

export interface MCPToolRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  requestId?: string;
}

export interface MCPToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  executionId: string;
  duration: number;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'http';
  tools: MCPTool[];
  authentication: {
    required: boolean;
    type: 'jwt' | 'api-key';
  };
}

export interface MCPToolLog {
  id: string;
  toolName: string;
  userId: string;
  userEmail: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: MCPExecutionStatus;
  duration: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface MCPToolStats {
  toolName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  lastExecutedAt?: Date;
}

export interface GetGitHubReposInput {
  owner?: string;
  type?: 'all' | 'owner' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  per_page?: number;
}

export interface CreateGitHubIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface GetPullRequestsInput {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  per_page?: number;
}

export interface CreateJiraTicketInput {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: 'Bug' | 'Task' | 'Story' | 'Epic';
  priority?: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  assignee?: string;
  labels?: string[];
}

export interface GetJiraIssuesInput {
  projectKey: string;
  status?: string;
  assignee?: string;
  maxResults?: number;
}

export interface DeployAppInput {
  appName: string;
  environment: 'development' | 'staging' | 'production';
  version?: string;
  force?: boolean;
}

export interface RestartServiceInput {
  serviceName: string;
  environment: 'development' | 'staging' | 'production';
}
