import { UserRoleCode } from '@prisma/client';

export interface CurrentUserData {
  id: string;
  email: string;
  roles: UserRoleCode[];
}