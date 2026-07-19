import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';


@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateRolePermissions(roleId: string, permissions: {
    canManageUsers?: boolean;
    canManageContent?: boolean;
    canManageBilling?: boolean;
    canManageSettings?: boolean;
  }) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { adminSettings: true },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (!role.adminSettings) {
      return this.prisma.adminSettings.create({
        data: {
          id: role.id,
          ...permissions,
        },
      });
    }

    return this.prisma.adminSettings.update({
      where: { id: role.id },
      data: {
        ...permissions,
      },
    });
  }
}