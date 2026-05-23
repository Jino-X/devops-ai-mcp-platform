import type { UserRole, Permission } from './auth.js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  createdAt: Date;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
