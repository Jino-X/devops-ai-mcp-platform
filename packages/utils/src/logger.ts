export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(
  name: string,
  options: { level?: LogLevel; format?: 'json' | 'pretty' } = {}
): Logger {
  const { level = 'info', format = 'json' } = options;
  const minLevel = LOG_LEVELS[level];

  const log = (logLevel: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) => {
    if (LOG_LEVELS[logLevel] < minLevel) return;

    const entry: LogEntry = {
      level: logLevel,
      message,
      timestamp: new Date().toISOString(),
      context: { ...context, logger: name },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = format === 'json' ? JSON.stringify(entry) : formatPretty(entry);

    switch (logLevel) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, error, context) => log('error', message, context, error),
  };
}

function formatPretty(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m',
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];

  let output = `${entry.timestamp} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.message}`;
    if (entry.error.stack) {
      output += `\n  ${entry.error.stack}`;
    }
  }

  return output;
}
