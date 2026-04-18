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
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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