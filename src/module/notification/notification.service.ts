import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { AuditService } from '../audit/audit.service';

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    actorUserId: string | null,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType: 'NOTIFICATION',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  async send(dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        payload: (dto.payload ?? {}) as object,
      },
    });

    this.gateway.sendToUser(dto.userId, notification);
    this.logger.log(`Notification sent to user ${dto.userId}: ${dto.title}`);
    this.audit(dto.userId, notification.id, 'CREATE', undefined, {
      title: dto.title,
      type: dto.type,
    });

    return notification;
  }

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markOneRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async broadcastToAllUsers(dto: {
    type: NotificationType;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    if (!users.length) {
      return { count: 0 };
    }

    const payloadObj = (dto.payload ?? {}) as object;

    const dataToCreate = users.map((u) => ({
      userId: u.id,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      payload: payloadObj,
    }));

    const result = await this.prisma.notification.createMany({
      data: dataToCreate,
    });

    if (this.gateway.server) {
      this.gateway.server.emit('notification', {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        payload: dto.payload,
        createdAt: new Date().toISOString(),
      });

      if (dto.payload?.isMaintenanceMode !== undefined) {
        this.gateway.server.emit('maintenanceAlert', {
          isMaintenanceMode: dto.payload.isMaintenanceMode,
          message: dto.body,
          title: dto.title,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.logger.log(
      `Broadcasted notification "${dto.title}" to ${users.length} users.`,
    );

    return result;
  }
}
