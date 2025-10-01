/**
 * Production-ready logger utility
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Check if we're in development mode
    this.isDevelopment = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || 
                        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatLog(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data,
      source
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private output(logEntry: LogEntry): void {
    if (this.isDevelopment) {
      // Development: Use console with colors
      const color = this.getConsoleColor(logEntry.level);
      console.log(
        `%c[${logEntry.timestamp}] ${logEntry.level}${logEntry.source ? ` (${logEntry.source})` : ''}: ${logEntry.message}`,
        color,
        logEntry.data || ''
      );
    } else {
      // Production: Structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  private getConsoleColor(level: string): string {
    switch (level) {
      case 'ERROR': return 'color: #ff4444; font-weight: bold;';
      case 'WARN': return 'color: #ffaa00; font-weight: bold;';
      case 'INFO': return 'color: #0088ff;';
      case 'DEBUG': return 'color: #888888;';
      default: return '';
    }
  }

  error(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLog(LogLevel.ERROR, message, data, source));
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog(LogLevel.WARN, message, data, source));
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog(LogLevel.INFO, message, data, source));
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog(LogLevel.DEBUG, message, data, source));
    }
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data, 'API');
  }

  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = `API Response: ${method} ${url} - ${status}`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, data, 'API');
    } else {
      this.debug(message, data, 'API');
    }
  }

  apiError(method: string, url: string, error: any): void {
    this.error(`API Error: ${method} ${url}`, error, 'API');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const log = {
  error: (message: string, data?: any, source?: string) => logger.error(message, data, source),
  warn: (message: string, data?: any, source?: string) => logger.warn(message, data, source),
  info: (message: string, data?: any, source?: string) => logger.info(message, data, source),
  debug: (message: string, data?: any, source?: string) => logger.debug(message, data, source),
  api: {
    request: (method: string, url: string, data?: any) => logger.apiRequest(method, url, data),
    response: (method: string, url: string, status: number, data?: any) => logger.apiResponse(method, url, status, data),
    error: (method: string, url: string, error: any) => logger.apiError(method, url, error)
  }
};
