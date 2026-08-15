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
    let orderToSet = dto.order;

    if (orderToSet !== undefined) {
      const existingWithOrder = await this.prisma.serviceGroup.findUnique({
        where: { order: orderToSet },
      });
      if (existingWithOrder) {
        throw new ConflictException(`Service group with order ${orderToSet} already exists`);
      }
    } else {
      const lastGroup = await this.prisma.serviceGroup.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      orderToSet = (lastGroup?.order ?? 0) + 1;
    }

    const created = await this.prisma.serviceGroup.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        order: orderToSet,
      },
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

    if (dto.order !== undefined && dto.order !== existing.order) {
      const existingWithOrder = await this.prisma.serviceGroup.findUnique({
        where: { order: dto.order },
      });
      if (existingWithOrder && existingWithOrder.id !== id) {
        throw new ConflictException(`Service group with order ${dto.order} already exists`);
      }
    }

    const updated = await this.prisma.serviceGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });

    this.audit(userId, id, 'UPDATE', existing, updated);
    return this.formatGroup(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);
    await this.prisma.serviceGroup.delete({ where: { id } });
    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
