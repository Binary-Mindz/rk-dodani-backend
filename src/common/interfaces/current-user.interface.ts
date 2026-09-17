import { TeamRole, UserRoleCode } from '@prisma/client';

export interface CurrentUserData {
  id: string;
  email: string;
  roles: UserRoleCode[];
  parentUserId?: string | null;
  teamRole?: TeamRole | null;
  rootEnterpriseId?: string | null;
}

