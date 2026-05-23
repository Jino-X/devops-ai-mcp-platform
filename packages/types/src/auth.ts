export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

export type UserRole = 'admin' | 'developer' | 'viewer' | 'service';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'github:read'
  | 'github:write'
  | 'jira:read'
  | 'jira:write'
  | 'mcp:execute'
  | 'mcp:admin'
  | 'logs:read'
  | 'settings:read'
  | 'settings:write'
  | 'deploy:execute'
  | 'admin:all';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'github:read',
    'github:write',
    'jira:read',
    'jira:write',
    'mcp:execute',
    'mcp:admin',
    'logs:read',
    'settings:read',
    'settings:write',
    'deploy:execute',
    'admin:all',
  ],
  developer: [
    'github:read',
    'github:write',
    'jira:read',
    'jira:write',
    'mcp:execute',
    'logs:read',
    'settings:read',
  ],
  viewer: ['github:read', 'jira:read', 'logs:read'],
  service: ['mcp:execute', 'github:read', 'jira:read'],
};

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}
