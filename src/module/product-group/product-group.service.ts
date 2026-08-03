import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';

@Injectable()
export class ProductGroupService {
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
        entityType: 'PRODUCT_GROUP',
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
    };
  }

  async create(userId: string | null, dto: CreateProductGroupDto) {
    const created = await this.prisma.productGroup.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
      },
    });

    this.audit(userId, created.id, 'CREATE', null, created);
    return this.formatGroup(created);
  }

  async findAll(query: QueryProductGroupDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductGroupWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productGroup.count({ where }),
    ]);

    return { items: items.map((item) => this.formatGroup(item)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const group = await this.prisma.productGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Product group with ID "${id}" not found`);
    return this.formatGroup(group);
  }

  async update(userId: string | null, id: string, dto: UpdateProductGroupDto) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.productGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });

    this.audit(userId, id, 'UPDATE', existing, updated);
    return this.formatGroup(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);
    await this.prisma.productGroup.delete({ where: { id } });
    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
