import Link from 'next/link';
import { ArrowRight, Github, Zap, Shield, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">DevOps AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            AI-Powered Developer Operations
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect your AI assistants to GitHub, Jira, and internal tools through MCP.
            Automate workflows, manage deployments, and boost productivity.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-card rounded-lg p-6 border">
            <Github className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-muted-foreground">
              Access repositories, manage PRs, create issues, and analyze code directly through AI.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">MCP Compatible</h3>
            <p className="text-muted-foreground">
              Works with VS Code Copilot, Cursor, Windsurf, Claude Desktop, and other MCP tools.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <Shield className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
            <p className="text-muted-foreground">
              Role-based access control, audit logging, and secure API patterns built-in.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
