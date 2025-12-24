import { Module, Global, DynamicModule } from '@nestjs/common';
import { LoggerService } from '@nestjs/common';

export interface LoggingModuleOptions {
  serviceName: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'pretty';
}

/**
 * Structured Logging Module for ShopFlow
 *
 * Outputs JSON logs compatible with ELK stack
 */
@Global()
@Module({})
export class LoggingModule {
  static forRoot(options: LoggingModuleOptions): DynamicModule {
    const loggerProvider = {
      provide: 'SHOPFLOW_LOGGER',
      useFactory: () => new ShopFlowLogger(options),
    };

    return {
      module: LoggingModule,
      providers: [loggerProvider],
      exports: ['SHOPFLOW_LOGGER'],
    };
  }
}

export class ShopFlowLogger implements LoggerService {
  private serviceName: string;
  private level: string;
  private format: string;

  constructor(options: LoggingModuleOptions) {
    this.serviceName = options.serviceName;
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.format = options.format || process.env.LOG_FORMAT || 'json';
  }

  log(message: string, context?: string, ...meta: unknown[]) {
    this.output('info', message, context, meta);
  }

  error(message: string, trace?: string, context?: string, ...meta: unknown[]) {
    this.output('error', message, context, [...meta, { trace }]);
  }

  warn(message: string, context?: string, ...meta: unknown[]) {
    this.output('warn', message, context, meta);
  }

  debug(message: string, context?: string, ...meta: unknown[]) {
    if (this.shouldLog('debug')) {
      this.output('debug', message, context, meta);
    }
  }

  verbose(message: string, context?: string, ...meta: unknown[]) {
    if (this.shouldLog('debug')) {
      this.output('verbose', message, context, meta);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'verbose', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private output(level: string, message: string, context?: string, meta?: unknown[]) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      context: context || 'Application',
      message,
      ...(meta && meta.length > 0 ? { meta } : {}),
    };

    if (this.format === 'json') {
      console.log(JSON.stringify(logEntry));
    } else {
      const colorMap: Record<string, string> = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[32m',
        debug: '\x1b[36m',
        verbose: '\x1b[35m',
      };
      const reset = '\x1b[0m';
      const color = colorMap[level] || '';

      console.log(
        `${logEntry.timestamp} ${color}[${level.toUpperCase()}]${reset} [${this.serviceName}] [${logEntry.context}] ${message}`
      );
      if (meta && meta.length > 0) {
        console.log('  Meta:', JSON.stringify(meta, null, 2));
      }
    }
  }
}

/**
 * Request logging interceptor helper
 */
export function formatRequestLog(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
): string {
  return JSON.stringify({
    type: 'http_request',
    method,
    url,
    statusCode,
    duration,
    userId,
  });
}
