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

  private includeRelations() {
    return {
      productGroup: true,
    };
  }

  private formatProduct(product: any) {
    if (!product) return product;
    return {
      id: product.id,
      name: product.title,
      description: product.description,
      productGroupId: product.productGroupId,
      productGroup: product.productGroup
        ? {
            id: product.productGroup.id,
            name: product.productGroup.name,
            description: product.productGroup.description,
            icon: product.productGroup.icon,
          }
        : null,
      architectureBlueprint: product.architectureBlueprint,
      retailBanking: product.retailBanking,
      capitalMarkets: product.capitalMarkets,
      wealthAndAsset: product.wealthAndAsset,
      initiateAthenionDiscussion: product.initiateAthenionDiscussion,
    };
  }

  private async validateProductGroupId(productGroupId?: string | null) {
    if (!productGroupId) return;
    const productGroup = await this.prisma.productGroup.findUnique({ where: { id: productGroupId } });
    if (!productGroup) {
      throw new BadRequestException('Product group not found');
    }
  }

  async create(userId: string | null, dto: CreateProductDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Product name is required');
    }

    await this.validateProductGroupId(dto.productGroupId);

    const created = await this.prisma.product.create({
      data: {
        title: dto.name,
        subTitle: dto.name,
        description: dto.description,
        architectureBlueprint: dto.architectureBlueprint ?? null,
        retailBanking: dto.retailBanking ?? null,
        capitalMarkets: dto.capitalMarkets ?? null,
        wealthAndAsset: dto.wealthAndAsset ?? null,
        initiateAthenionDiscussion: dto.initiateAthenionDiscussion ?? null,
        productGroupId: dto.productGroupId ?? null,
      },
      include: this.includeRelations(),
    });

    this.audit(userId, 'PRODUCT', created.id, 'CREATE', null, created);
    return this.formatProduct(created);
  }

  async findAll(query: QueryProductDto, publicOnly = false) {
    const { search, productGroupId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(publicOnly && { isActive: true }),
      ...(productGroupId && { productGroupId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { architectureBlueprint: { contains: search, mode: 'insensitive' } },
          { retailBanking: { contains: search, mode: 'insensitive' } },
          { capitalMarkets: { contains: search, mode: 'insensitive' } },
          { wealthAndAsset: { contains: search, mode: 'insensitive' } },
          { initiateAthenionDiscussion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: this.includeRelations(),
        orderBy: { title: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatProduct(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.includeRelations(),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return this.formatProduct(product);
  }

  async update(userId: string | null, id: string, dto: UpdateProductDto) {
    const existing = await this.findOne(id);
    await this.validateProductGroupId(dto.productGroupId);
    const { name, ...productData } = dto;
    const mappedProductData = {
      ...productData,
      ...(name !== undefined && { title: name, subTitle: name }),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(mappedProductData).length > 0) {
        await tx.product.update({
          where: { id },
          data: mappedProductData,
        });
      }

      return tx.product.findUnique({
        where: { id },
        include: this.includeRelations(),
      });
    });

    this.audit(userId, 'PRODUCT', id, 'UPDATE', existing, updated);
    return this.formatProduct(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    this.audit(userId, 'PRODUCT', id, 'DELETE', existing, null);
    return { success: true, id };
  }

}
