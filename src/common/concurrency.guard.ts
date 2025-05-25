import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

let concurrentRequests = Number(process.env.CONCURRENCY_REQUEST);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT);

@Injectable()
export class ConcurrencyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (concurrentRequests >= MAX_CONCURRENT) {
      throw new BadRequestException('Max concurrent uploads reached');
    }
    concurrentRequests++;
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    res.on('finish', () => concurrentRequests--);
    return true;
  }
}
