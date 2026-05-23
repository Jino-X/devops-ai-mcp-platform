import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry, type UserRole } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw Object.assign(new Error('User with this email already exists'), {
        statusCode: 409,
        code: 'CONFLICT',
        isOperational: true,
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: 'developer',
      },
    });

    const tokens = await this.createSession(user.id, user.email, user.role, ipAddress, userAgent);

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        isOperational: true,
      });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is disabled'), {
        statusCode: 403,
        code: 'AUTHORIZATION_ERROR',
        isOperational: true,
      });
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        isOperational: true,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.createSession(user.id, user.email, user.role, ipAddress, userAgent);

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw Object.assign(new Error('Invalid or expired refresh token'), {
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        isOperational: true,
      });
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      await prisma.session.delete({ where: { id: session.id } });
      throw Object.assign(new Error('Invalid refresh token'), {
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        isOperational: true,
      });
    }

    const accessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      expiresIn: 900,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
    logger.info('All sessions revoked', { userId });
  }

  private async createSession(
    userId: string,
    email: string,
    role: UserRole,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const accessToken = generateAccessToken({ userId, email, role });
    const refreshToken = generateRefreshToken({ userId, email, role });
    const expiresAt = getTokenExpiry('7d');

    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}

export const authService = new AuthService();
