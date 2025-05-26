import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as basicAuth from 'basic-auth';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = basicAuth(req);

    if (!user || user.name !== process.env.BASIC_AUTH_USER || user.pass !== process.env.BASIC_AUTH_PASS) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
