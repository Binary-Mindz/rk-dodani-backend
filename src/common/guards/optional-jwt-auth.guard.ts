import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
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
