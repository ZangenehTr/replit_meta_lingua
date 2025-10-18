import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  instance: string;
  message: string;
  metadata?: any;
  stack?: string;
}

class StructuredLogger {
  private logDir = path.join(process.cwd(), 'logs');
  private service = 'metalingua';
  private instance = process.env.SERVER_INSTANCE_ID || 'default';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.logLevel];
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeToFile(filename: string, content: string) {
    const filepath = path.join(this.logDir, filename);
    try {
      fs.appendFileSync(filepath, content);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private log(level: LogLevel, message: string, metadata?: any, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      instance: this.instance,
      message,
      metadata,
      stack: error?.stack,
    };

    const formatted = this.formatLogEntry(entry);

    // Write to combined log
    this.writeToFile('combined.log', formatted);

    // Write errors to separate error log
    if (level === 'error') {
      this.writeToFile('error.log', formatted);
    }

    // Console output with color
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    };
    const reset = '\x1b[0m';
    const color = colors[level];
    console.log(`${color}[${entry.timestamp}] [${level.toUpperCase()}]${reset} ${message}`, metadata || '');
  }

  debug(message: string, metadata?: any) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: any) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: any, error?: Error) {
    this.log('error', message, metadata, error);
  }
}

export const logger = new StructuredLogger();

// Structured event logging helpers
export const logEvent = {
  auth: (event: string, userId: number, metadata: any = {}) => {
    logger.info(`AUTH_EVENT: ${event}`, { userId, ...metadata });
  },

  payment: (event: string, amount: number, metadata: any = {}) => {
    logger.info(`PAYMENT_EVENT: ${event}`, { amount, ...metadata });
  },

  callern: (event: string, roomId: string, metadata: any = {}) => {
    logger.info(`CALLERN_EVENT: ${event}`, { roomId, ...metadata });
  },

  ai: (event: string, service: string, latency: number, metadata: any = {}) => {
    logger.info(`AI_EVENT: ${event}`, { service, latency, ...metadata });
  },

  error: (error: Error, context: any = {}) => {
    logger.error(`APPLICATION_ERROR: ${error.message}`, context, error);
  },
};
