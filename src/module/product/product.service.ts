import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
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

    const created = await this.prisma.product.create({
      data: {
        title: dto.title.trim(),
        subTitle: dto.subTitle.trim(),
        module: dto.module.trim(),
        description: dto.description.trim(),
        scaleValueImpact: (dto.scaleValueImpact as any) ?? null,
        mitigationVector: (dto.mitigationVector as any) ?? null,
        platformCapabilitiesDescriptor: (dto.platformCapabilitiesDescriptor as any) ?? null,
        retailBanking: (dto.retailBanking as any) ?? null,
        capitalMarkets: (dto.capitalMarkets as any) ?? null,
        wealthAndAsset: (dto.wealthAndAsset as any) ?? null,
      },
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
        orderBy: { createdAt: 'desc' },
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

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.subTitle !== undefined && { subTitle: dto.subTitle.trim() }),
        ...(dto.module !== undefined && { module: dto.module.trim() }),
        ...(dto.description !== undefined && { description: dto.description.trim() }),
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

    this.audit(userId, id, 'UPDATE', existing, updated);
    return updated;
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID "${id}" not found`);

    await this.prisma.product.delete({ where: { id } });
    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
