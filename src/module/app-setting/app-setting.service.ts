import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UpsertAppSettingDto } from './dto/upsert-app-setting.dto';
import { QueryAppSettingDto } from './dto/query-app-setting.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AppSettingService {
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

  async upsert(userId: string | null, dto: UpsertAppSettingDto) {
    const result = await this.prisma.appSetting.upsert({
      where: {
        groupName_key: {
          groupName: dto.groupName,
          key: dto.key,
        },
      },
      update: {
        value: dto.value as Prisma.InputJsonValue,
        isPublic: dto.isPublic ?? false,
        description: dto.description ?? null,
        updatedById: userId,
      },
      create: {
        groupName: dto.groupName,
        key: dto.key,
        value: dto.value as Prisma.InputJsonValue,
        isPublic: dto.isPublic ?? false,
        description: dto.description ?? null,
        updatedById: userId,
      },
      include: {
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const settingId = `${dto.groupName}:${dto.key}`;
    this.audit(userId, 'SETTINGS', settingId, 'UPDATE', undefined, {
      key: dto.key,
      value: dto.value,
    });
    return result;
  }

  async findAdminAll(query: QueryAppSettingDto) {
    return this.prisma.appSetting.findMany({
      where: {
        ...(query.groupName ? { groupName: query.groupName } : {}),
        ...(query.key ? { key: query.key } : {}),
        ...(typeof query.isPublic === 'boolean'
          ? { isPublic: query.isPublic }
          : {}),
      },
      include: {
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: [{ groupName: 'asc' }, { key: 'asc' }],
    });
  }

  async findPublicAll(query: QueryAppSettingDto) {
    return this.prisma.appSetting.findMany({
      where: {
        isPublic: true,
        ...(query.groupName ? { groupName: query.groupName } : {}),
        ...(query.key ? { key: query.key } : {}),
      },
      select: {
        groupName: true,
        key: true,
        value: true,
        description: true,
      },
      orderBy: [{ groupName: 'asc' }, { key: 'asc' }],
    });
  }

  async findOne(groupName: string, key: string) {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        groupName_key: {
          groupName,
          key,
        },
      },
      include: {
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!setting) {
      throw new NotFoundException('App setting not found');
    }

    return setting;
  }

  async remove(groupName: string, key: string) {
    const existing = await this.prisma.appSetting.findUnique({
      where: {
        groupName_key: {
          groupName,
          key,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('App setting not found');
    }

    const settingId = `${groupName}:${key}`;
    this.audit(
      null,
      'SETTINGS',
      settingId,
      'DELETE',
      { key, value: existing.value },
      undefined,
    );
    await this.prisma.appSetting.delete({
      where: {
        groupName_key: {
          groupName,
          key,
        },
      },
    });

    return { deleted: true };
  }
}
