import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

interface JiraUserFormatted {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl: string;
  active: boolean;
}

interface JiraIssueTypeFormatted {
  id: string;
  name: string;
  iconUrl: string;
  subtask: boolean;
}

interface JiraPriorityFormatted {
  id: string;
  name: string;
  iconUrl: string;
}

interface JiraStatusFormatted {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
}

interface JiraProjectFormatted {
  id: string;
  key: string;
  name: string;
  avatarUrl: string;
  projectTypeKey: string;
}

interface JiraComponentFormatted {
  id: string;
  name: string;
  description?: string;
}

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: JiraStatusFormatted;
  issueType: JiraIssueTypeFormatted;
  priority: JiraPriorityFormatted;
  assignee?: JiraUserFormatted;
  reporter: JiraUserFormatted;
  project: JiraProjectFormatted;
  labels: string[];
  components: JiraComponentFormatted[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolution?: string;
}

interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
}

interface JiraApiOptions {
  config: JiraConfig;
  method?: string;
  body?: Record<string, unknown>;
}

async function jiraFetch<T>(endpoint: string, options: JiraApiOptions): Promise<T> {
  const { config, method = 'GET', body } = options;
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

  const response = await fetch(`${config.host}/rest/api/3${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error((error as { message?: string }).message ?? 'Jira API error'), {
      statusCode: response.status,
      code: 'JIRA_API_ERROR',
      isOperational: true,
      details: error,
    });
  }

  return response.json() as Promise<T>;
}

export class JiraService {
  async getConfig(userId: string): Promise<JiraConfig> {
    const integration = await prisma.jiraIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      const envConfig = {
        host: process.env['JIRA_HOST'],
        email: process.env['JIRA_EMAIL'],
        apiToken: process.env['JIRA_API_TOKEN'],
      };

      if (envConfig.host && envConfig.email && envConfig.apiToken) {
        return envConfig as JiraConfig;
      }

      throw Object.assign(new Error('Jira integration not configured'), {
        statusCode: 400,
        code: 'JIRA_NOT_CONFIGURED',
        isOperational: true,
      });
    }

    return {
      host: integration.host,
      email: integration.email,
      apiToken: integration.apiToken,
    };
  }

  async saveIntegration(
    userId: string,
    data: { host: string; email: string; apiToken: string; defaultProjectKey?: string }
  ) {
    await prisma.jiraIntegration.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data, updatedAt: new Date() },
    });

    logger.info('Jira integration saved', { userId });
  }

  async getIssues(userId: string, projectKey: string, options: { status?: string; maxResults?: number } = {}) {
    const config = await this.getConfig(userId);
    const { status, maxResults = 50 } = options;

    let jql = `project = ${projectKey}`;
    if (status) {
      jql += ` AND status = "${status}"`;
    }
    jql += ' ORDER BY created DESC';

    const response = await jiraFetch<{ issues: Array<Record<string, unknown>>; total: number }>(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
      { config }
    );

    return {
      issues: response.issues.map((issue) => this.formatIssue(issue)),
      total: response.total,
    };
  }

  async getIssue(userId: string, issueKey: string) {
    const config = await this.getConfig(userId);
    const issue = await jiraFetch<Record<string, unknown>>(`/issue/${issueKey}`, { config });
    return this.formatIssue(issue);
  }

  async createIssue(
    userId: string,
    data: {
      projectKey: string;
      summary: string;
      description?: string;
      issueType: string;
      priority?: string;
      assignee?: string;
      labels?: string[];
    }
  ) {
    const config = await this.getConfig(userId);

    const issueData: Record<string, unknown> = {
      fields: {
        project: { key: data.projectKey },
        summary: data.summary,
        issuetype: { name: data.issueType },
        ...(data.description && {
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: data.description }],
              },
            ],
          },
        }),
        ...(data.priority && { priority: { name: data.priority } }),
        ...(data.assignee && { assignee: { accountId: data.assignee } }),
        ...(data.labels && { labels: data.labels }),
      },
    };

    const response = await jiraFetch<Record<string, unknown>>('/issue', {
      config,
      method: 'POST',
      body: issueData,
    });

    logger.info('Jira issue created', { issueKey: response['key'] });

    return this.getIssue(userId, response['key'] as string);
  }

  async updateIssue(
    userId: string,
    issueKey: string,
    data: { summary?: string; description?: string; priority?: string; assignee?: string; labels?: string[] }
  ) {
    const config = await this.getConfig(userId);

    const updateData: Record<string, unknown> = {
      fields: {
        ...(data.summary && { summary: data.summary }),
        ...(data.description && {
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: data.description }],
              },
            ],
          },
        }),
        ...(data.priority && { priority: { name: data.priority } }),
        ...(data.assignee && { assignee: { accountId: data.assignee } }),
        ...(data.labels && { labels: data.labels }),
      },
    };

    await jiraFetch(`/issue/${issueKey}`, {
      config,
      method: 'PUT',
      body: updateData,
    });

    logger.info('Jira issue updated', { issueKey });

    return this.getIssue(userId, issueKey);
  }

  async addComment(userId: string, issueKey: string, body: string) {
    const config = await this.getConfig(userId);

    await jiraFetch(`/issue/${issueKey}/comment`, {
      config,
      method: 'POST',
      body: {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: body }],
            },
          ],
        },
      },
    });

    logger.info('Jira comment added', { issueKey });
  }

  async transitionIssue(userId: string, issueKey: string, transitionId: string) {
    const config = await this.getConfig(userId);

    await jiraFetch(`/issue/${issueKey}/transitions`, {
      config,
      method: 'POST',
      body: { transition: { id: transitionId } },
    });

    logger.info('Jira issue transitioned', { issueKey, transitionId });
  }

  async getTransitions(userId: string, issueKey: string) {
    const config = await this.getConfig(userId);

    const response = await jiraFetch<{ transitions: Array<Record<string, unknown>> }>(
      `/issue/${issueKey}/transitions`,
      { config }
    );

    return response.transitions.map((t) => ({
      id: t['id'] as string,
      name: t['name'] as string,
      to: {
        id: ((t['to'] as Record<string, unknown>)?.['id'] as string) ?? '',
        name: ((t['to'] as Record<string, unknown>)?.['name'] as string) ?? '',
        category: ((t['to'] as Record<string, unknown>)?.['statusCategory'] as Record<string, unknown>)?.['key'] as string ?? 'todo',
      },
    }));
  }

  private formatIssue(issue: Record<string, unknown>): JiraIssue {
    const fields = issue['fields'] as Record<string, unknown>;
    const status = fields['status'] as Record<string, unknown>;
    const issueType = fields['issuetype'] as Record<string, unknown>;
    const priority = fields['priority'] as Record<string, unknown>;
    const assignee = fields['assignee'] as Record<string, unknown> | null;
    const reporter = fields['reporter'] as Record<string, unknown>;
    const project = fields['project'] as Record<string, unknown>;

    return {
      id: issue['id'] as string,
      key: issue['key'] as string,
      summary: fields['summary'] as string,
      description: this.extractDescription(fields['description']),
      status: {
        id: status['id'] as string,
        name: status['name'] as string,
        category: this.mapStatusCategory((status['statusCategory'] as Record<string, unknown>)?.['key'] as string),
      },
      issueType: {
        id: issueType['id'] as string,
        name: issueType['name'] as string,
        iconUrl: issueType['iconUrl'] as string,
        subtask: issueType['subtask'] as boolean,
      },
      priority: {
        id: priority['id'] as string,
        name: priority['name'] as string,
        iconUrl: priority['iconUrl'] as string,
      },
      assignee: assignee
        ? {
            accountId: assignee['accountId'] as string,
            displayName: assignee['displayName'] as string,
            emailAddress: assignee['emailAddress'] as string | undefined,
            avatarUrl: ((assignee['avatarUrls'] as Record<string, string>)?.['48x48']) ?? '',
            active: assignee['active'] as boolean,
          }
        : undefined,
      reporter: {
        accountId: reporter['accountId'] as string,
        displayName: reporter['displayName'] as string,
        emailAddress: reporter['emailAddress'] as string | undefined,
        avatarUrl: ((reporter['avatarUrls'] as Record<string, string>)?.['48x48']) ?? '',
        active: reporter['active'] as boolean,
      },
      project: {
        id: project['id'] as string,
        key: project['key'] as string,
        name: project['name'] as string,
        avatarUrl: ((project['avatarUrls'] as Record<string, string>)?.['48x48']) ?? '',
        projectTypeKey: project['projectTypeKey'] as string,
      },
      labels: (fields['labels'] as string[]) ?? [],
      components: ((fields['components'] as Array<Record<string, unknown>>) ?? []).map((c) => ({
        id: c['id'] as string,
        name: c['name'] as string,
        description: c['description'] as string | undefined,
      })),
      createdAt: fields['created'] as string,
      updatedAt: fields['updated'] as string,
      dueDate: fields['duedate'] as string | undefined,
      resolution: (fields['resolution'] as Record<string, unknown>)?.['name'] as string | undefined,
    };
  }

  private extractDescription(description: unknown): string | undefined {
    if (!description) return undefined;
    if (typeof description === 'string') return description;

    const doc = description as { content?: Array<{ content?: Array<{ text?: string }> }> };
    return doc.content
      ?.map((block) => block.content?.map((inline) => inline.text ?? '').join('') ?? '')
      .join('\n');
  }

  private mapStatusCategory(key: string): 'todo' | 'in_progress' | 'done' {
    switch (key) {
      case 'new':
      case 'undefined':
        return 'todo';
      case 'indeterminate':
        return 'in_progress';
      case 'done':
        return 'done';
      default:
        return 'todo';
    }
  }
}

export const jiraService = new JiraService();
