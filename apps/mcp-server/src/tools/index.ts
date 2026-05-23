import { z } from 'zod';
import * as api from '../lib/api-client.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const tools: Tool[] = [
  {
    name: 'get_github_repos',
    description: 'Fetch GitHub repositories for the authenticated user. Returns a list of repositories with details like name, description, stars, and language.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of repositories to fetch: all, owner, member',
          enum: ['all', 'owner', 'member'],
        },
        sort: {
          type: 'string',
          description: 'Sort order: created, updated, pushed, full_name',
          enum: ['created', 'updated', 'pushed', 'full_name'],
        },
        per_page: {
          type: 'number',
          description: 'Number of repositories to fetch (max 100)',
        },
      },
    },
  },
  {
    name: 'create_github_issue',
    description: 'Create a new issue in a GitHub repository. Requires owner, repo, and title. Optionally add body, labels, and assignees.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        title: {
          type: 'string',
          description: 'Issue title',
        },
        body: {
          type: 'string',
          description: 'Issue body/description',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add to the issue',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Usernames to assign to the issue',
        },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 'get_pull_requests',
    description: 'Get pull requests for a GitHub repository. Filter by state (open, closed, all).',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        state: {
          type: 'string',
          description: 'PR state filter',
          enum: ['open', 'closed', 'all'],
        },
        per_page: {
          type: 'number',
          description: 'Number of PRs to fetch',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'create_jira_ticket',
    description: 'Create a new Jira ticket/issue. Requires project key, summary, and issue type.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Jira project key (e.g., PROJ)',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        description: {
          type: 'string',
          description: 'Issue description',
        },
        issueType: {
          type: 'string',
          description: 'Type of issue',
          enum: ['Bug', 'Task', 'Story', 'Epic'],
        },
        priority: {
          type: 'string',
          description: 'Issue priority',
          enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
        },
        assignee: {
          type: 'string',
          description: 'Assignee account ID',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add',
        },
      },
      required: ['projectKey', 'summary', 'issueType'],
    },
  },
  {
    name: 'get_jira_issues',
    description: 'Get Jira issues for a project. Filter by status.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Jira project key',
        },
        status: {
          type: 'string',
          description: 'Filter by status (e.g., "To Do", "In Progress", "Done")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of issues to return',
        },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'get_project_metrics',
    description: 'Get project analytics and metrics including commits, PRs, and issues statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        period: {
          type: 'string',
          description: 'Time period for metrics',
          enum: ['day', 'week', 'month'],
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'fetch_logs',
    description: 'Fetch application logs. Filter by service, level, and time range.',
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Service name to fetch logs for',
        },
        level: {
          type: 'string',
          description: 'Log level filter',
          enum: ['debug', 'info', 'warn', 'error'],
        },
        limit: {
          type: 'number',
          description: 'Number of log entries to fetch',
        },
      },
    },
  },
  {
    name: 'deploy_app',
    description: 'Deploy an application to a specified environment. Use with caution in production.',
    inputSchema: {
      type: 'object',
      properties: {
        appName: {
          type: 'string',
          description: 'Application name to deploy',
        },
        environment: {
          type: 'string',
          description: 'Target environment',
          enum: ['development', 'staging', 'production'],
        },
        version: {
          type: 'string',
          description: 'Version to deploy (defaults to latest)',
        },
        force: {
          type: 'boolean',
          description: 'Force deployment even if checks fail',
        },
      },
      required: ['appName', 'environment'],
    },
  },
  {
    name: 'restart_service',
    description: 'Restart a service in a specified environment.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: {
          type: 'string',
          description: 'Service name to restart',
        },
        environment: {
          type: 'string',
          description: 'Target environment',
          enum: ['development', 'staging', 'production'],
        },
      },
      required: ['serviceName', 'environment'],
    },
  },
  {
    name: 'get_users',
    description: 'Get list of users in the system. Filter by role.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number',
        },
        limit: {
          type: 'number',
          description: 'Number of users per page',
        },
        role: {
          type: 'string',
          description: 'Filter by role',
          enum: ['admin', 'developer', 'viewer', 'service'],
        },
      },
    },
  },
  {
    name: 'create_user',
    description: 'Create a new user in the system. Requires admin permissions.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address',
        },
        password: {
          type: 'string',
          description: 'User password (min 8 characters)',
        },
        name: {
          type: 'string',
          description: 'User display name',
        },
        role: {
          type: 'string',
          description: 'User role',
          enum: ['admin', 'developer', 'viewer', 'service'],
        },
      },
      required: ['email', 'password', 'name'],
    },
  },
];

const getGitHubReposSchema = z.object({
  type: z.enum(['all', 'owner', 'member']).optional(),
  sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional(),
  per_page: z.number().max(100).optional(),
});

const createGitHubIssueSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

const getPullRequestsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  state: z.enum(['open', 'closed', 'all']).optional(),
  per_page: z.number().max(100).optional(),
});

const createJiraTicketSchema = z.object({
  projectKey: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional(),
  issueType: z.enum(['Bug', 'Task', 'Story', 'Epic']),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const getJiraIssuesSchema = z.object({
  projectKey: z.string().min(1),
  status: z.string().optional(),
  maxResults: z.number().max(100).optional(),
});

const deployAppSchema = z.object({
  appName: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string().optional(),
  force: z.boolean().optional(),
});

const restartServiceSchema = z.object({
  serviceName: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
});

const getUsersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().max(100).optional(),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['admin', 'developer', 'viewer', 'service']).optional(),
});

export const toolHandlers: Record<string, ToolHandler> = {
  get_github_repos: async (args) => {
    const input = getGitHubReposSchema.parse(args);
    return api.getGitHubRepos(input);
  },

  create_github_issue: async (args) => {
    const input = createGitHubIssueSchema.parse(args);
    return api.createGitHubIssue(input);
  },

  get_pull_requests: async (args) => {
    const input = getPullRequestsSchema.parse(args);
    return api.getPullRequests(input.owner, input.repo, {
      state: input.state,
      per_page: input.per_page,
    });
  },

  create_jira_ticket: async (args) => {
    const input = createJiraTicketSchema.parse(args);
    return api.createJiraTicket(input);
  },

  get_jira_issues: async (args) => {
    const input = getJiraIssuesSchema.parse(args);
    return api.getJiraIssues(input.projectKey, {
      status: input.status,
      maxResults: input.maxResults,
    });
  },

  get_project_metrics: async (args) => {
    return {
      message: 'Project metrics feature coming soon',
      args,
    };
  },

  fetch_logs: async (args) => {
    return {
      message: 'Log fetching feature coming soon',
      args,
    };
  },

  deploy_app: async (args) => {
    const input = deployAppSchema.parse(args);
    return {
      message: `Deployment initiated for ${input.appName} to ${input.environment}`,
      status: 'pending',
      ...input,
    };
  },

  restart_service: async (args) => {
    const input = restartServiceSchema.parse(args);
    return {
      message: `Service restart initiated for ${input.serviceName} in ${input.environment}`,
      status: 'pending',
      ...input,
    };
  },

  get_users: async (args) => {
    const input = getUsersSchema.parse(args);
    return api.getUsers(input);
  },

  create_user: async (args) => {
    const input = createUserSchema.parse(args);
    return api.createUser(input);
  },
};
