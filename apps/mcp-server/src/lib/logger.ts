import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = process.env['MCP_LOG_DIR'] ?? '/tmp/devops-ai-mcp';
const LOG_LEVEL = process.env['MCP_LOG_LEVEL'] ?? 'info';

const LOG_LEVELS: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatMessage(level: string, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}\n`;
}

function shouldLog(level: string): boolean {
  return (LOG_LEVELS[level] ?? 1) >= (LOG_LEVELS[LOG_LEVEL] ?? 1);
}

function writeLog(level: string, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, message, context);

  process.stderr.write(formatted);

  try {
    ensureLogDir();
    const logFile = join(LOG_DIR, `mcp-${new Date().toISOString().split('T')[0]}.log`);
    appendFileSync(logFile, formatted);
  } catch {
    // Ignore file write errors
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => writeLog('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => writeLog('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog('error', message, context),
};
