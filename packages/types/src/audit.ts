export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'execute'
  | 'deploy'
  | 'restart';

export type AuditResource =
  | 'user'
  | 'session'
  | 'github_repo'
  | 'github_issue'
  | 'github_pr'
  | 'jira_issue'
  | 'mcp_tool'
  | 'deployment'
  | 'service'
  | 'settings';

export interface CreateAuditLogRequest {
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditStats {
  totalActions: number;
  successCount: number;
  failureCount: number;
  actionsByType: Record<AuditAction, number>;
  actionsByResource: Record<AuditResource, number>;
  topUsers: Array<{
    userId: string;
    userEmail: string;
    actionCount: number;
  }>;
}
