export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  language?: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  user: GitHubUser;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  draft: boolean;
  head: GitHubBranch;
  base: GitHubBranch;
  labels: GitHubLabel[];
  reviewers: GitHubUser[];
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: 'User' | 'Organization' | 'Bot';
}

export interface GitHubBranch {
  ref: string;
  sha: string;
  repo: {
    id: number;
    name: string;
    fullName: string;
  };
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  htmlUrl: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
}

export interface GitHubIntegrationConfig {
  id: string;
  userId: string;
  accessToken: string;
  tokenType: 'personal' | 'oauth' | 'app';
  scope?: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubWebhookEvent {
  id: string;
  event: string;
  action?: string;
  repository: string;
  sender: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

export interface RepositoryAnalytics {
  repository: string;
  period: 'day' | 'week' | 'month';
  commits: number;
  pullRequests: {
    opened: number;
    merged: number;
    closed: number;
  };
  issues: {
    opened: number;
    closed: number;
  };
  contributors: number;
  codeFrequency: {
    additions: number;
    deletions: number;
  };
}
