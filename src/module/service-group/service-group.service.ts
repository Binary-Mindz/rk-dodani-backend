import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { QueryServiceGroupDto } from './dto/query-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';

@Injectable()
export class ServiceGroupService {
  constructor(
    private readonly prisma: PrismaService,
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
        entityType: 'SERVICE_GROUP',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  private formatGroup(group: any) {
    if (!group) return group;
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      icon: group.icon,
      order: group.order,
    };
  }

  async create(userId: string | null, dto: CreateServiceGroupDto) {
    const created = await this.prisma.$transaction(async (tx) => {
      let orderToSet = dto.order;

      if (orderToSet !== undefined) {
        const affected = await tx.serviceGroup.findMany({
          where: { order: { gte: orderToSet } },
          orderBy: { order: 'desc' },
          select: { id: true, order: true },
        });

        for (const item of affected) {
          await tx.serviceGroup.update({
            where: { id: item.id },
            data: { order: item.order + 1 },
          });
        }
      } else {
        const lastGroup = await tx.serviceGroup.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        orderToSet = (lastGroup?.order ?? 0) + 1;
      }

      return tx.serviceGroup.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          icon: dto.icon ?? null,
          order: orderToSet,
        },
      });
    });

    this.audit(userId, created.id, 'CREATE', null, created);
    return this.formatGroup(created);
  }

  async findAll(query: QueryServiceGroupDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.ServiceGroupWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.serviceGroup.count({ where }),
    ]);

    return { items: items.map((item) => this.formatGroup(item)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const group = await this.prisma.serviceGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Service group with ID "${id}" not found`);
    return this.formatGroup(group);
  }

  async update(userId: string | null, id: string, dto: UpdateServiceGroupDto) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      let orderToSet = existing.order;

      if (dto.order !== undefined && dto.order !== existing.order) {
        const targetOrder = dto.order;

        // Temporarily assign a safe negative value to free slot
        await tx.serviceGroup.update({
          where: { id },
          data: { order: -existing.order },
        });

        if (targetOrder < existing.order) {
          // Moving UP (e.g. 4 -> 1): Shift 1..3 up by 1 (1->2, 2->3, 3->4)
          const affected = await tx.serviceGroup.findMany({
            where: {
              order: { gte: targetOrder, lt: existing.order },
            },
            orderBy: { order: 'desc' },
            select: { id: true, order: true },
          });

          for (const item of affected) {
            await tx.serviceGroup.update({
              where: { id: item.id },
              data: { order: item.order + 1 },
            });
          }
        } else {
          // Moving DOWN (e.g. 1 -> 4): Shift 2..4 down by 1 (2->1, 3->2, 4->3)
          const affected = await tx.serviceGroup.findMany({
            where: {
              order: { gt: existing.order, lte: targetOrder },
            },
            orderBy: { order: 'asc' },
            select: { id: true, order: true },
          });

          for (const item of affected) {
            await tx.serviceGroup.update({
              where: { id: item.id },
              data: { order: item.order - 1 },
            });
          }
        }

        orderToSet = targetOrder;
      }

      return tx.serviceGroup.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.icon !== undefined && { icon: dto.icon }),
          order: orderToSet,
        },
      });
    });

    this.audit(userId, id, 'UPDATE', existing, updated);
    return this.formatGroup(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceGroup.delete({ where: { id } });

      const affected = await tx.serviceGroup.findMany({
        where: { order: { gt: existing.order } },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });

      for (const item of affected) {
        await tx.serviceGroup.update({
          where: { id: item.id },
          data: { order: item.order - 1 },
        });
      }
    });

    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
