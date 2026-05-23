import { Activity, GitPullRequest, Ticket, Users, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Repos</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open PRs</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <GitPullRequest className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jira Tickets</p>
              <p className="text-2xl font-bold">38</p>
            </div>
            <Ticket className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">MCP Executions</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Created PR', repo: 'devops-ai-platform', time: '2 hours ago' },
              { action: 'Merged PR', repo: 'api-gateway', time: '4 hours ago' },
              { action: 'Created Issue', repo: 'frontend-app', time: '6 hours ago' },
              { action: 'Deployed', repo: 'backend-service', time: '1 day ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.repo}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          <div className="space-y-4">
            {[
              { name: 'John Doe', role: 'Admin', status: 'online' },
              { name: 'Jane Smith', role: 'Developer', status: 'online' },
              { name: 'Bob Wilson', role: 'Developer', status: 'offline' },
              { name: 'Alice Brown', role: 'Viewer', status: 'online' },
            ].map((member, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
