import jwt, { SignOptions } from 'jsonwebtoken';

export type UserRole = 'admin' | 'developer' | 'viewer' | 'service';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  developer: ['read', 'write', 'deploy'],
  viewer: ['read'],
  service: ['read', 'write'],
};

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'development-secret-change-me';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'refresh-secret-change-me';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '15m';
const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function generateAccessToken(payload: TokenPayload): string {
  const permissions = ROLE_PERMISSIONS[payload.role];
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): TokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload & { iat: number; exp: number };
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 15 * 60 * 1000);
  }

  const [, valueStr, unit] = match;
  const value = parseInt(valueStr ?? '15', 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * (multipliers[unit ?? 'm'] ?? 60000));
}
