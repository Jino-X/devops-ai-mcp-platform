import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

interface GitHubUser {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: 'User' | 'Organization' | 'Bot';
}

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface GitHubRepoRef {
  id: number;
  name: string;
  fullName: string;
}

interface GitHubBranch {
  ref: string;
  sha: string;
  repo: GitHubRepoRef;
}

interface GitHubRepository {
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

interface GitHubPullRequest {
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

interface GitHubIssue {
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

interface GitHubCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  htmlUrl: string;
  stats?: { additions: number; deletions: number; total: number };
}

interface GitHubContributor {
  id: number;
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubApiOptions {
  token: string;
  method?: string;
  body?: Record<string, unknown>;
}

async function githubFetch<T>(endpoint: string, options: GitHubApiOptions): Promise<T> {
  const { token, method = 'GET', body } = options;

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error((error as { message?: string }).message ?? 'GitHub API error'), {
      statusCode: response.status,
      code: 'GITHUB_API_ERROR',
      isOperational: true,
      details: error,
    });
  }

  return response.json() as Promise<T>;
}

export class GitHubService {
  async getToken(userId: string): Promise<string> {
    const integration = await prisma.gitHubIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      const envToken = process.env['GITHUB_TOKEN'];
      if (envToken) return envToken;

      throw Object.assign(new Error('GitHub integration not configured'), {
        statusCode: 400,
        code: 'GITHUB_NOT_CONFIGURED',
        isOperational: true,
      });
    }

    return integration.accessToken;
  }

  async saveIntegration(userId: string, accessToken: string, tokenType = 'personal') {
    await prisma.gitHubIntegration.upsert({
      where: { userId },
      create: { userId, accessToken, tokenType },
      update: { accessToken, tokenType, updatedAt: new Date() },
    });

    logger.info('GitHub integration saved', { userId });
  }

  async getRepositories(userId: string, options: { type?: string; sort?: string; per_page?: number } = {}) {
    const token = await this.getToken(userId);
    const { type = 'all', sort = 'updated', per_page = 30 } = options;

    const repos = await githubFetch<Array<Record<string, unknown>>>(
      `/user/repos?type=${type}&sort=${sort}&per_page=${per_page}`,
      { token }
    );

    return repos.map((repo) => this.formatRepository(repo));
  }

  async getRepository(userId: string, owner: string, repo: string) {
    const token = await this.getToken(userId);
    const data = await githubFetch<Record<string, unknown>>(`/repos/${owner}/${repo}`, { token });
    return this.formatRepository(data);
  }

  async getPullRequests(
    userId: string,
    owner: string,
    repo: string,
    options: { state?: string; per_page?: number } = {}
  ) {
    const token = await this.getToken(userId);
    const { state = 'open', per_page = 30 } = options;

    const prs = await githubFetch<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=${per_page}`,
      { token }
    );

    return prs.map((pr) => this.formatPullRequest(pr));
  }

  async getIssues(
    userId: string,
    owner: string,
    repo: string,
    options: { state?: string; per_page?: number } = {}
  ) {
    const token = await this.getToken(userId);
    const { state = 'open', per_page = 30 } = options;

    const issues = await githubFetch<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`,
      { token }
    );

    return issues.filter((i) => !i['pull_request']).map((issue) => this.formatIssue(issue));
  }

  async createIssue(
    userId: string,
    owner: string,
    repo: string,
    data: { title: string; body?: string; labels?: string[]; assignees?: string[] }
  ) {
    const token = await this.getToken(userId);

    const issue = await githubFetch<Record<string, unknown>>(`/repos/${owner}/${repo}/issues`, {
      token,
      method: 'POST',
      body: data,
    });

    logger.info('GitHub issue created', { owner, repo, issueNumber: issue['number'] });

    return this.formatIssue(issue);
  }

  async getCommits(userId: string, owner: string, repo: string, options: { per_page?: number } = {}) {
    const token = await this.getToken(userId);
    const { per_page = 30 } = options;

    const commits = await githubFetch<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/commits?per_page=${per_page}`,
      { token }
    );

    return commits.map((commit) => this.formatCommit(commit));
  }

  async getContributors(userId: string, owner: string, repo: string) {
    const token = await this.getToken(userId);

    const contributors = await githubFetch<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/contributors`,
      { token }
    );

    return contributors.map((c) => this.formatContributor(c));
  }

  private formatRepository(repo: Record<string, unknown>): GitHubRepository {
    return {
      id: repo['id'] as number,
      name: repo['name'] as string,
      fullName: repo['full_name'] as string,
      description: repo['description'] as string | undefined,
      private: repo['private'] as boolean,
      htmlUrl: repo['html_url'] as string,
      cloneUrl: repo['clone_url'] as string,
      defaultBranch: repo['default_branch'] as string,
      language: repo['language'] as string | undefined,
      stargazersCount: repo['stargazers_count'] as number,
      forksCount: repo['forks_count'] as number,
      openIssuesCount: repo['open_issues_count'] as number,
      createdAt: repo['created_at'] as string,
      updatedAt: repo['updated_at'] as string,
      pushedAt: repo['pushed_at'] as string,
    };
  }

  private formatPullRequest(pr: Record<string, unknown>): GitHubPullRequest {
    const user = pr['user'] as Record<string, unknown>;
    const head = pr['head'] as Record<string, unknown>;
    const base = pr['base'] as Record<string, unknown>;
    const headRepo = head['repo'] as Record<string, unknown>;
    const baseRepo = base['repo'] as Record<string, unknown>;

    return {
      id: pr['id'] as number,
      number: pr['number'] as number,
      title: pr['title'] as string,
      body: pr['body'] as string | undefined,
      state: pr['state'] as 'open' | 'closed',
      htmlUrl: pr['html_url'] as string,
      user: {
        id: user['id'] as number,
        login: user['login'] as string,
        avatarUrl: user['avatar_url'] as string,
        htmlUrl: user['html_url'] as string,
        type: user['type'] as 'User' | 'Organization' | 'Bot',
      },
      createdAt: pr['created_at'] as string,
      updatedAt: pr['updated_at'] as string,
      closedAt: pr['closed_at'] as string | undefined,
      mergedAt: pr['merged_at'] as string | undefined,
      draft: pr['draft'] as boolean,
      head: {
        ref: head['ref'] as string,
        sha: head['sha'] as string,
        repo: {
          id: headRepo['id'] as number,
          name: headRepo['name'] as string,
          fullName: headRepo['full_name'] as string,
        },
      },
      base: {
        ref: base['ref'] as string,
        sha: base['sha'] as string,
        repo: {
          id: baseRepo['id'] as number,
          name: baseRepo['name'] as string,
          fullName: baseRepo['full_name'] as string,
        },
      },
      labels: ((pr['labels'] as Array<Record<string, unknown>>) ?? []).map((l) => ({
        id: l['id'] as number,
        name: l['name'] as string,
        color: l['color'] as string,
        description: l['description'] as string | undefined,
      })),
      reviewers: ((pr['requested_reviewers'] as Array<Record<string, unknown>>) ?? []).map((r) => ({
        id: r['id'] as number,
        login: r['login'] as string,
        avatarUrl: r['avatar_url'] as string,
        htmlUrl: r['html_url'] as string,
        type: r['type'] as 'User' | 'Organization' | 'Bot',
      })),
      additions: pr['additions'] as number,
      deletions: pr['deletions'] as number,
      changedFiles: pr['changed_files'] as number,
    };
  }

  private formatIssue(issue: Record<string, unknown>): GitHubIssue {
    const user = issue['user'] as Record<string, unknown>;

    return {
      id: issue['id'] as number,
      number: issue['number'] as number,
      title: issue['title'] as string,
      body: issue['body'] as string | undefined,
      state: issue['state'] as 'open' | 'closed',
      htmlUrl: issue['html_url'] as string,
      user: {
        id: user['id'] as number,
        login: user['login'] as string,
        avatarUrl: user['avatar_url'] as string,
        htmlUrl: user['html_url'] as string,
        type: user['type'] as 'User' | 'Organization' | 'Bot',
      },
      labels: ((issue['labels'] as Array<Record<string, unknown>>) ?? []).map((l) => ({
        id: l['id'] as number,
        name: l['name'] as string,
        color: l['color'] as string,
        description: l['description'] as string | undefined,
      })),
      assignees: ((issue['assignees'] as Array<Record<string, unknown>>) ?? []).map((a) => ({
        id: a['id'] as number,
        login: a['login'] as string,
        avatarUrl: a['avatar_url'] as string,
        htmlUrl: a['html_url'] as string,
        type: a['type'] as 'User' | 'Organization' | 'Bot',
      })),
      createdAt: issue['created_at'] as string,
      updatedAt: issue['updated_at'] as string,
      closedAt: issue['closed_at'] as string | undefined,
    };
  }

  private formatCommit(commit: Record<string, unknown>): GitHubCommit {
    const commitData = commit['commit'] as Record<string, unknown>;
    const author = commitData['author'] as Record<string, unknown>;

    return {
      sha: commit['sha'] as string,
      message: commitData['message'] as string,
      author: {
        name: author['name'] as string,
        email: author['email'] as string,
        date: author['date'] as string,
      },
      htmlUrl: commit['html_url'] as string,
      stats: commit['stats']
        ? {
            additions: (commit['stats'] as Record<string, number>)['additions'] ?? 0,
            deletions: (commit['stats'] as Record<string, number>)['deletions'] ?? 0,
            total: (commit['stats'] as Record<string, number>)['total'] ?? 0,
          }
        : undefined,
    };
  }

  private formatContributor(contributor: Record<string, unknown>): GitHubContributor {
    return {
      id: contributor['id'] as number,
      login: contributor['login'] as string,
      avatarUrl: contributor['avatar_url'] as string,
      contributions: contributor['contributions'] as number,
      htmlUrl: contributor['html_url'] as string,
    };
  }
}

export const githubService = new GitHubService();
