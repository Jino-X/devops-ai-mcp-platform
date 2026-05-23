export const API_VERSION = 'v1';

export const AUTH = {
  BCRYPT_ROUNDS: 12,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },
  API: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  MCP: {
    windowMs: 60 * 1000,
    max: 30,
  },
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  JIRA_API_ERROR: 'JIRA_API_ERROR',
  MCP_EXECUTION_ERROR: 'MCP_EXECUTION_ERROR',
} as const;

export const MCP_TOOLS = {
  GITHUB: {
    GET_REPOS: 'get_github_repos',
    CREATE_ISSUE: 'create_github_issue',
    GET_PULL_REQUESTS: 'get_pull_requests',
    GET_COMMITS: 'get_commits',
    GET_CONTRIBUTORS: 'get_contributors',
  },
  JIRA: {
    CREATE_TICKET: 'create_jira_ticket',
    GET_ISSUES: 'get_jira_issues',
    UPDATE_ISSUE: 'update_jira_issue',
    ADD_COMMENT: 'add_jira_comment',
  },
  DEVOPS: {
    DEPLOY_APP: 'deploy_app',
    RESTART_SERVICE: 'restart_service',
    GET_LOGS: 'fetch_logs',
  },
  ANALYTICS: {
    GET_PROJECT_METRICS: 'get_project_metrics',
  },
  USERS: {
    GET_USERS: 'get_users',
    CREATE_USER: 'create_user',
  },
} as const;

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  X_REQUEST_ID: 'X-Request-ID',
  X_CORRELATION_ID: 'X-Correlation-ID',
  X_RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
  X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  X_RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const;
