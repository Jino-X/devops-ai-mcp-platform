export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: JiraStatus;
  issueType: JiraIssueType;
  priority: JiraPriority;
  assignee?: JiraUser;
  reporter: JiraUser;
  project: JiraProject;
  labels: string[];
  components: JiraComponent[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolution?: string;
  timeTracking?: JiraTimeTracking;
}

export interface JiraStatus {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
}

export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl: string;
  subtask: boolean;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl: string;
  active: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl: string;
  projectTypeKey: string;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

export interface JiraTimeTracking {
  originalEstimate?: string;
  remainingEstimate?: string;
  timeSpent?: string;
}

export interface JiraComment {
  id: string;
  body: string;
  author: JiraUser;
  createdAt: string;
  updatedAt: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
}

export interface JiraIntegrationConfig {
  id: string;
  userId: string;
  host: string;
  email: string;
  apiToken: string;
  defaultProjectKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJiraIssueRequest {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
  dueDate?: string;
}

export interface UpdateJiraIssueRequest {
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  dueDate?: string;
}

export interface JiraSearchRequest {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

export interface JiraProjectAnalytics {
  projectKey: string;
  period: 'day' | 'week' | 'month';
  issuesCreated: number;
  issuesResolved: number;
  issuesInProgress: number;
  avgResolutionTime: number;
  issuesByType: Record<string, number>;
  issuesByPriority: Record<string, number>;
}
