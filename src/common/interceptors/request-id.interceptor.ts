import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { RequestContextService } from '../request-context.service';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly contextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const requestId = uuidv4();
    const contextMap = new Map<string, any>();
    contextMap.set('requestId', requestId);

    this.contextService.run(() => {
      req.requestId = requestId;
      next.handle().subscribe();
    }, contextMap);

    return next.handle();
  }
}
