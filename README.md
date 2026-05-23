# DevOps AI Platform

AI-powered developer operations platform with MCP (Model Context Protocol) integration. Connect your AI assistants to GitHub, Jira, and internal tools.

## Features

- **MCP Server**: Compatible with VS Code Copilot, Cursor, Windsurf, Claude Desktop
- **GitHub Integration**: Repositories, PRs, issues, commits, contributors
- **Jira Integration**: Tickets, comments, status updates, assignments
- **Authentication**: JWT-based auth with refresh tokens and RBAC
- **Audit Logging**: Track all actions for compliance and debugging
- **Modern UI**: Next.js dashboard with Tailwind CSS and shadcn/ui

## Architecture

```
devops-ai-platform/
├── apps/
│   ├── api/          # Express.js backend
│   ├── web/          # Next.js frontend
│   └── mcp-server/   # MCP server for AI tools
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Environment and validation
│   └── utils/        # Shared utilities
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase account (free tier available at https://supabase.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jino-X/devops-ai-mcp-platform.git
cd devops-ai-mcp-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure Supabase (see below)
# Then push database schema
npm run db:push

# Start development servers
npm run dev
```

### Supabase Setup

1. Create a project at https://supabase.com
2. Go to **Project Settings** → **Database**
3. Copy connection strings to your `.env` file:
   - **Session mode** (port 5432) → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

### Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL`: Supabase pooled connection string
- `DIRECT_URL`: Supabase direct connection string
- `JWT_SECRET`: Secret for JWT signing
- `GITHUB_TOKEN`: GitHub personal access token (optional)
- `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN`: Jira credentials (optional)

## MCP Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "devops-ai": {
      "command": "node",
      "args": ["/path/to/devops-ai-platform/apps/mcp-server/dist/index.js"],
      "env": {
        "API_URL": "http://localhost:4000",
        "MCP_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### VS Code / Cursor / Windsurf

Add to your MCP settings:

```json
{
  "mcp": {
    "servers": {
      "devops-ai": {
        "command": "node",
        "args": ["./apps/mcp-server/dist/index.js"],
        "cwd": "/path/to/devops-ai-platform",
        "env": {
          "API_URL": "http://localhost:4000",
          "MCP_API_TOKEN": "your-api-token"
        }
      }
    }
  }
}
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_github_repos` | Fetch GitHub repositories |
| `create_github_issue` | Create a new GitHub issue |
| `get_pull_requests` | Get pull requests for a repo |
| `create_jira_ticket` | Create a new Jira ticket |
| `get_jira_issues` | Get Jira issues for a project |
| `get_project_metrics` | Get project analytics |
| `fetch_logs` | Fetch application logs |
| `deploy_app` | Deploy an application |
| `restart_service` | Restart a service |
| `get_users` | List platform users |
| `create_user` | Create a new user |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### GitHub
- `GET /api/v1/github/repos` - List repositories
- `GET /api/v1/github/repos/:owner/:repo` - Get repository
- `GET /api/v1/github/repos/:owner/:repo/pulls` - List PRs
- `GET /api/v1/github/repos/:owner/:repo/issues` - List issues
- `POST /api/v1/github/repos/:owner/:repo/issues` - Create issue

### Jira
- `GET /api/v1/jira/projects/:key/issues` - List issues
- `GET /api/v1/jira/issues/:key` - Get issue
- `POST /api/v1/jira/issues` - Create issue
- `PATCH /api/v1/jira/issues/:key` - Update issue

### Health
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Development

```bash
# Run all apps in development
npm run dev

# Run specific app
npm run dev --workspace=@devops-ai/api
npm run dev --workspace=@devops-ai/web
npm run dev --workspace=@devops-ai/mcp-server

# Build all
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Database commands
npm run db:push      # Push schema to Supabase
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## Deployment

### Docker (with Supabase)

```bash
# Set your Supabase credentials in .env first
docker-compose up -d
```

### AWS

See `docs/deployment/aws.md` for AWS deployment guide.

## Security

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting
- Input validation with Zod
- Audit logging
- Helmet security headers
- CORS configuration
