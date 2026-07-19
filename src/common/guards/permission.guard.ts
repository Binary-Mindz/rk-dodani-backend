import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/permission-settings.decorator';

const PERMISSION_FLAG_MAP = {
  'users:manage': 'canManageUsers',
  'content:manage': 'canManageContent',
  'billing:manage': 'canManageBilling',
  'settings:manage': 'canManageSettings',
} as const;

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: string };

    if (!user?.id) {
      return false;
    }

    const activeRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: { roleId: true },
    });

    if (!activeRoles.length) {
      return false;
    }

    const settings = await this.prisma.adminSettings.findMany({
      where: {
        id: {
          in: activeRoles.map((role) => role.roleId),
        },
      },
    });

    if (!settings.length) {
      return false;
    }

    return requiredPermissions.every((permission) => {
      const flagKey = PERMISSION_FLAG_MAP[permission as keyof typeof PERMISSION_FLAG_MAP];
      if (!flagKey) {
        return false;
      }
      return settings.some((setting) => setting[flagKey] === true);
    });
  }
}
