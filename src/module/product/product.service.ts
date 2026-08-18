import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ReorderProductsDto } from './dto/reorder-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
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
      .logCustom({ actorUserId, entityType: 'PRODUCT', entityId, action: action as any, oldValues, newValues })
      .catch(() => {});
  }

  async create(userId: string | null, dto: CreateProductDto) {
    if (!dto.title?.trim()) throw new BadRequestException('Product title is required');
    if (!dto.subTitle?.trim()) throw new BadRequestException('Product subtitle is required');
    if (!dto.module?.trim()) throw new BadRequestException('Product module is required');
    if (!dto.description?.trim()) throw new BadRequestException('Product description is required');

    const created = await this.prisma.$transaction(async (tx) => {
      let orderToSet = dto.order;

      if (orderToSet !== undefined) {
        const affected = await tx.product.findMany({
          where: { order: { gte: orderToSet } },
          orderBy: { order: 'desc' },
          select: { id: true, order: true },
        });

        for (const item of affected) {
          await tx.product.update({
            where: { id: item.id },
            data: { order: item.order + 1 },
          });
        }
      } else {
        const lastProduct = await tx.product.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        orderToSet = (lastProduct?.order ?? 0) + 1;
      }

      return tx.product.create({
        data: {
          title: dto.title.trim(),
          subTitle: dto.subTitle.trim(),
          module: dto.module.trim(),
          description: dto.description.trim(),
          order: orderToSet,
          scaleValueImpact: (dto.scaleValueImpact as any) ?? null,
          mitigationVector: (dto.mitigationVector as any) ?? null,
          platformCapabilitiesDescriptor: (dto.platformCapabilitiesDescriptor as any) ?? null,
          retailBanking: (dto.retailBanking as any) ?? null,
          capitalMarkets: (dto.capitalMarkets as any) ?? null,
          wealthAndAsset: (dto.wealthAndAsset as any) ?? null,
        },
      });
    });

    this.audit(userId, created.id, 'CREATE', null, created);
    return created;
  }

  async findAll(query: QueryProductDto, publicOnly = false) {
    const { search, module, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(publicOnly && { isActive: true }),
      ...(module && { module: { equals: module, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { subTitle: { contains: search, mode: 'insensitive' } },
          { module: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);
    return product;
  }

  async update(userId: string | null, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID "${id}" not found`);

    const updated = await this.prisma.$transaction(async (tx) => {
      let orderToSet = existing.order;

      if (dto.order !== undefined && dto.order !== existing.order) {
        const targetOrder = dto.order;

        await tx.product.update({
          where: { id },
          data: { order: -existing.order },
        });

        if (targetOrder < existing.order) {
          // Moving UP (e.g. 4 -> 1): Shift 1..3 up by 1 (1->2, 2->3, 3->4)
          const affected = await tx.product.findMany({
            where: {
              order: { gte: targetOrder, lt: existing.order },
            },
            orderBy: { order: 'desc' },
            select: { id: true, order: true },
          });

          for (const item of affected) {
            await tx.product.update({
              where: { id: item.id },
              data: { order: item.order + 1 },
            });
          }
        } else {
          // Moving DOWN (e.g. 1 -> 4): Shift 2..4 down by 1 (2->1, 3->2, 4->3)
          const affected = await tx.product.findMany({
            where: {
              order: { gt: existing.order, lte: targetOrder },
            },
            orderBy: { order: 'asc' },
            select: { id: true, order: true },
          });

          for (const item of affected) {
            await tx.product.update({
              where: { id: item.id },
              data: { order: item.order - 1 },
            });
          }
        }

        orderToSet = targetOrder;
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.subTitle !== undefined && { subTitle: dto.subTitle.trim() }),
          ...(dto.module !== undefined && { module: dto.module.trim() }),
          ...(dto.description !== undefined && { description: dto.description.trim() }),
          ...(dto.order !== undefined && { order: orderToSet }),
          ...(dto.scaleValueImpact !== undefined && { scaleValueImpact: (dto.scaleValueImpact as any) ?? null }),
          ...(dto.mitigationVector !== undefined && { mitigationVector: (dto.mitigationVector as any) ?? null }),
          ...(dto.platformCapabilitiesDescriptor !== undefined && {
            platformCapabilitiesDescriptor: (dto.platformCapabilitiesDescriptor as any) ?? null,
          }),
          ...(dto.retailBanking !== undefined && { retailBanking: (dto.retailBanking as any) ?? null }),
          ...(dto.capitalMarkets !== undefined && { capitalMarkets: (dto.capitalMarkets as any) ?? null }),
          ...(dto.wealthAndAsset !== undefined && { wealthAndAsset: (dto.wealthAndAsset as any) ?? null }),
        },
      });
    });

    this.audit(userId, id, 'UPDATE', existing, updated);
    return updated;
  }

  async reorder(userId: string | null, dto: ReorderProductsDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Items array cannot be empty');
    }

    await this.prisma.$transaction(async (tx) => {
      // Temporarily set negative orders to prevent any potential duplicate or index conflict
      for (let i = 0; i < dto.items.length; i++) {
        await tx.product.update({
          where: { id: dto.items[i].id },
          data: { order: -(i + 1) },
        });
      }

      // Assign target orders
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }
    });

    const products = await this.prisma.product.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    this.audit(userId, 'ALL', 'UPDATE', null, { reorderedCount: dto.items.length });
    return products;
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID "${id}" not found`);

    await this.prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await tx.product.updateMany({
        where: { order: { gt: existing.order } },
        data: { order: { decrement: 1 } },
      });
    });

    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
