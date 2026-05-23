const API_URL = process.env['API_URL'] ?? 'http://localhost:4000';
const API_TOKEN = process.env['MCP_API_TOKEN'];

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    token?: string;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token = API_TOKEN } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!data.success) {
    throw new Error(data.error?.message ?? 'API request failed');
  }

  return data.data as T;
}

export async function getGitHubRepos(options: { type?: string; sort?: string; per_page?: number } = {}) {
  const params = new URLSearchParams();
  if (options.type) params.set('type', options.type);
  if (options.sort) params.set('sort', options.sort);
  if (options.per_page) params.set('per_page', options.per_page.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/github/repos${query}`);
}

export async function createGitHubIssue(data: {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}) {
  return apiRequest('/api/v1/github/repos/' + data.owner + '/' + data.repo + '/issues', {
    method: 'POST',
    body: data,
  });
}

export async function getPullRequests(owner: string, repo: string, options: { state?: string; per_page?: number } = {}) {
  const params = new URLSearchParams();
  if (options.state) params.set('state', options.state);
  if (options.per_page) params.set('per_page', options.per_page.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/github/repos/${owner}/${repo}/pulls${query}`);
}

export async function getJiraIssues(projectKey: string, options: { status?: string; maxResults?: number } = {}) {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.maxResults) params.set('maxResults', options.maxResults.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/jira/projects/${projectKey}/issues${query}`);
}

export async function createJiraTicket(data: {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
}) {
  return apiRequest('/api/v1/jira/issues', {
    method: 'POST',
    body: data,
  });
}

export async function getUsers(options: { page?: number; limit?: number; role?: string } = {}) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.role) params.set('role', options.role);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/users${query}`);
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) {
  return apiRequest('/api/v1/users', {
    method: 'POST',
    body: data,
  });
}
