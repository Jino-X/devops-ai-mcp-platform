import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

type UserRole = 'admin' | 'developer' | 'viewer' | 'service';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  developer: ['read', 'write', 'deploy'],
  viewer: ['read'],
  service: ['read', 'write'],
};

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
}

interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export class UserService {
  async create(input: CreateUserInput) {
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
        role: input.role ?? 'developer',
      },
    });

    logger.info('User created', { userId: user.id, email: user.email });

    return this.formatUser(user);
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
        isOperational: true,
      });
    }

    return this.formatUser(user);
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
        isOperational: true,
      });
    }

    return this.formatUser(user);
  }

  async list(params: ListUsersParams) {
    const { page = 1, limit = 20, role, isActive, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where['role'] = role;
    if (typeof isActive === 'boolean') where['isActive'] = isActive;
    if (search) {
      where['OR'] = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u: UserRecord) => this.formatUser(u)),
      total,
      page,
      limit,
    };
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
        isOperational: true,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: input,
    });

    logger.info('User updated', { userId: id, changes: Object.keys(input) });

    return this.formatUser(updatedUser);
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
        isOperational: true,
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info('User deleted', { userId: id });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
        isOperational: true,
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw Object.assign(new Error('Current password is incorrect'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        isOperational: true,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.session.deleteMany({
      where: { userId: id },
    });

    logger.info('Password changed', { userId: id });
  }

  private formatUser(user: UserRecord) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();
