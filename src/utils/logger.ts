import { config } from '../config/index.js';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(this.formatMessage(LogLevel.INFO, message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (config.logging.level === LogLevel.DEBUG) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
export type LoggerInstance = typeof logger; 