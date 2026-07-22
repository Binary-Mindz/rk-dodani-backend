import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UpsertAppSettingDto } from './dto/upsert-app-setting.dto';
import { QueryAppSettingDto } from './dto/query-app-setting.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AuditService } from '../audit/audit.service';
import { AlertService } from '../alert/alert.service';
import { NotificationService } from '../notification/notification.service';
import { MailService } from 'common/mail/mail.service';

@Injectable()
export class AppSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly alertService: AlertService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
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

  async getMaintenanceStatus() {
    let maintenance = await this.prisma.systemMaintenance.findFirst();

    if (!maintenance) {
      maintenance = await this.prisma.systemMaintenance.create({
        data: { isUnderMaintenance: false },
      });
    }

    return {
      isUnderMaintenance: maintenance.isUnderMaintenance,
      updatedAt: maintenance.updatedAt,
    };
  }

  async updateMaintenanceStatus(
    userId: string | null,
    dto: UpdateMaintenanceDto,
  ) {
    let maintenance = await this.prisma.systemMaintenance.findFirst();

    const previousStatus = maintenance ? maintenance.isUnderMaintenance : false;

    if (!maintenance) {
      maintenance = await this.prisma.systemMaintenance.create({
        data: { isUnderMaintenance: dto.isUnderMaintenance },
      });
    } else {
      maintenance = await this.prisma.systemMaintenance.update({
        where: { id: maintenance.id },
        data: { isUnderMaintenance: dto.isUnderMaintenance },
      });
    }

    const isModeChanged = previousStatus !== dto.isUnderMaintenance;

    if (isModeChanged) {
      const alertMessage = dto.isUnderMaintenance
        ? 'Website is under maintenance.'
        : 'Website has been removed from maintenance.';

      await this.alertService
        .create_new_alert_into_db({
          message: alertMessage,
          alertType: 'MAINTENANCE' as any,
          alertMethod: 'PUSH' as any,
        })
        .catch(() => {});

      const notificationTitle = dto.isUnderMaintenance
        ? 'Website Under Maintenance'
        : 'Website Removed From Maintenance';

      await this.notificationService
        .broadcastToAllUsers({
          type: 'SYSTEM_ALERT',
          title: notificationTitle,
          body: alertMessage,
          payload: {
            isUnderMaintenance: dto.isUnderMaintenance,
            timestamp: new Date().toISOString(),
          },
        })
        .catch(() => {});

      this.sendMaintenanceEmailsToAll(dto.isUnderMaintenance).catch(() => {});
    }

    this.audit(
      userId,
      'MAINTENANCE',
      maintenance.id,
      'UPDATE',
      { isUnderMaintenance: previousStatus },
      { isUnderMaintenance: dto.isUnderMaintenance },
    );

    return {
      isUnderMaintenance: maintenance.isUnderMaintenance,
      updatedAt: maintenance.updatedAt,
    };
  }

  private async sendMaintenanceEmailsToAll(isUnderMaintenance: boolean) {
    const users = await this.prisma.user.findMany({
      select: { email: true },
    });

    for (const u of users) {
      if (u.email) {
        await this.mailService
          .sendMaintenanceNotification(u.email, isUnderMaintenance)
          .catch(() => {});
      }
    }
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
