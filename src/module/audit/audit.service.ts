import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

async log(dto: CreateAuditLogDto) {
  return this.prisma.auditLog.create({
    data: {
      actorUserId: dto.actorUserId ?? null,
      entityType: dto.entityType,
      entityId: dto.entityId ?? null,
      action: dto.action,
      oldValues:
        dto.oldValues !== undefined
          ? ((dto.oldValues ?? Prisma.JsonNull) as
              | Prisma.InputJsonValue
              | typeof Prisma.JsonNull)
          : undefined,
      newValues:
        dto.newValues !== undefined
          ? ((dto.newValues ?? Prisma.JsonNull) as
              | Prisma.InputJsonValue
              | typeof Prisma.JsonNull)
          : undefined,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      requestId: dto.requestId ?? null,
    },
  });
}

  async logCreate(params: {
    actorUserId?: string | null;
    entityType: string;
    entityId?: string | null;
    newValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  }) {
    return this.log({
      actorUserId: params.actorUserId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      action: AuditAction.CREATE,
      newValues: params.newValues,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      requestId: params.requestId ?? undefined,
    });
  }

  async logUpdate(params: {
    actorUserId?: string | null;
    entityType: string;
    entityId?: string | null;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  }) {
    return this.log({
      actorUserId: params.actorUserId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      action: AuditAction.UPDATE,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      requestId: params.requestId ?? undefined,
    });
  }

  async logDelete(params: {
    actorUserId?: string | null;
    entityType: string;
    entityId?: string | null;
    oldValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  }) {
    return this.log({
      actorUserId: params.actorUserId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      action: AuditAction.DELETE,
      oldValues: params.oldValues,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      requestId: params.requestId ?? undefined,
    });
  }

  async logCustom(params: {
    actorUserId?: string | null;
    entityType: string;
    entityId?: string | null;
    action: AuditAction;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  }) {
    return this.log({
      actorUserId: params.actorUserId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      action: params.action,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      requestId: params.requestId ?? undefined,
    });
  }

  async findAll(query: QueryAuditLogDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.entityType ? { entityType: { contains: query.entityType, mode: 'insensitive' } } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { actorUser: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { entityType: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      if (query.status.toLowerCase() === 'failed') {
        where.action = { in: ['DELETE', 'REVOKE'] };
      } else if (query.status.toLowerCase() === 'success') {
        where.action = { notIn: ['DELETE', 'REVOKE'] };
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const formattedItems = items.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      admin: log.actorUser
        ? {
            id: log.actorUser.id,
            fullName: log.actorUser.fullName,
            email: log.actorUser.email,
            avatarUrl: log.actorUser.avatarUrl,
          }
        : null,
      action: this.formatAuditAction(log.action, log.entityType, log.newValues),
      module: log.entityType,
      ipAddress: log.ipAddress,
      status: log.action === 'DELETE' || log.action === 'REVOKE' ? 'Failed' : 'Success',
    }));

    return {
      items: formattedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportLogs(query: QueryAuditLogDto) {
    const unlimitedQuery = { ...query, page: 1, limit: 10000 };
    const result = await this.findAll(unlimitedQuery);
    return result.items;
  }

  private formatAuditAction(
    action: string,
    entityType: string,
    newValues: any,
  ): string {
    const actionMap: Record<string, string> = {
      CREATE: 'Created',
      UPDATE: 'Updated',
      DELETE: 'Deleted',
      LOGIN: 'Logged in',
      LOGOUT: 'Logged out',
      PUBLISH: 'Published',
      ARCHIVE: 'Archived',
      ASSIGN: 'Assigned',
      GRANT: 'Granted',
      REVOKE: 'Revoked',
    };

    const actionVerb = actionMap[action] || action;
    const entityLabel = entityType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    let detail = `${actionVerb} ${entityLabel}`;

    if (newValues && typeof newValues === 'object') {
      const keys = Object.keys(newValues).slice(0, 2);
      if (keys.length > 0) {
        const summary = keys
          .map((k) => `${k} to ${newValues[k]}`)
          .join(', ');
        detail += ` — ${summary}`;
      }
    }

    return detail;
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actorUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return log;
  }
}