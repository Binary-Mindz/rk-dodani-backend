import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser | false,
    info: any,
  ): TUser | null {
    if (err || info) {
      return null;
    }

    return user || null;
  }
}
