import { UserRoleCode } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRoleCode[];
}