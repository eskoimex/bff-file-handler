import { LoggerService, Injectable, LogLevel } from '@nestjs/common';
import { RequestContextService } from '../request-context.service';

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(private readonly context: RequestContextService) {}

  log(message: any, context?: string) {
    this.print('log', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.print('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.print('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.print('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.print('verbose', message, context);
  }

  private print(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const requestId = this.context.get('requestId');
    const timestamp = new Date().toISOString();

    const log = {
      timestamp,
      level,
      context: context || null,
      requestId: requestId || null,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      trace: trace || null,
    };

    console.log(JSON.stringify(log));
  }
}
