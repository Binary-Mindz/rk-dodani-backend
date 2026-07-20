import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    actorUserId: string | null,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType,
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  async getRoleByCode(code: UserRoleCode) {
    const role = await this.prisma.role.findUnique({
      where: { code },
    });

    if (!role) {
      throw new NotFoundException(`Role ${code} not found`);
    }

    return role;
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { adminSettings: true },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    return {
      roleId: role.id,
      permissions: role.adminSettings || {
        canManageUsers: false,
        canManageContent: false,
        canManageBilling: false,
        canManageSettings: false,
      },
    };
  }

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      include: { adminSettings: true },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((role) => ({
      roleId: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.adminSettings || {
        canManageUsers: false,
        canManageContent: false,
        canManageBilling: false,
        canManageSettings: false,
      },
    }));
  }

  async updateRolePermissions(
    roleId: string,
    permissions: {
      canManageUsers?: boolean;
      canManageContent?: boolean;
      canManageBilling?: boolean;
      canManageSettings?: boolean;
    },
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { adminSettings: true },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (!role.adminSettings) {
      const created = await this.prisma.adminSettings.create({
        data: {
          id: role.id,
          ...permissions,
        },
      });
      this.audit(null, 'ROLE', roleId, 'UPDATE', {}, permissions);
      return created;
    }

    const updated = await this.prisma.adminSettings.update({
      where: { id: role.id },
      data: {
        ...permissions,
      },
    });
    this.audit(null, 'ROLE', roleId, 'UPDATE', role.adminSettings, updated);
    return updated;
  }
}
