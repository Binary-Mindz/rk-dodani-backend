import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../interfaces/current-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    return data ? user?.[data] : user;
  },
);