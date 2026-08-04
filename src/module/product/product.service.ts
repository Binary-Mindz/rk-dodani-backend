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

  private includeRelations() {
    return {
      productGroup: true,
      sectors: { orderBy: { sectorType: 'asc' as const } },
      targetClient: true,
    };
  }

  private formatProduct(product: any) {
    if (!product) return product;
    return {
      id: product.id,
      name: product.title,
      description: product.description,
      productImage: product.productImage,
      productGroupId: product.productGroupId,
      productGroup: product.productGroup ?? null,
      architectureBlueprint: product.architectureBlueprint,
      initiateAthenionDiscussion: product.initiateAthenionDiscussion,
      sectors: product.sectors ?? [],
      targetClient: product.targetClient ?? [],
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async validateProductGroupId(productGroupId?: string | null) {
    if (!productGroupId) return;
    const group = await this.prisma.productGroup.findUnique({ where: { id: productGroupId } });
    if (!group) throw new BadRequestException('Product group not found');
  }

  async create(userId: string | null, dto: CreateProductDto) {
    if (!dto.name?.trim()) throw new BadRequestException('Product name is required');
    await this.validateProductGroupId(dto.productGroupId);

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.name,
          subTitle: dto.name,
          description: dto.description,
          productImage: dto.productImage ?? null,
          architectureBlueprint: dto.architectureBlueprint ?? null,
          initiateAthenionDiscussion: dto.initiateAthenionDiscussion ?? null,
          productGroupId: dto.productGroupId ?? null,
        },
      });

      if (dto.sectors?.length) {
        await tx.productSector.createMany({
          data: dto.sectors.map((s) => ({
            productId: product.id,
            sectorType: s.sectorType,
            title: s.title,
            description: s.description ?? null,
            keyFeatures: s.keyFeatures ?? [],
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUnique({ where: { id: product.id }, include: this.includeRelations() });
    });

    this.audit(userId, created!.id, 'CREATE', null, created);
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
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatProduct(item)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
    if (!product) throw new NotFoundException(`Product with ID "${id}" not found`);
    return this.formatProduct(product);
  }

  async update(userId: string | null, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID "${id}" not found`);

    await this.validateProductGroupId(dto.productGroupId);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { title: dto.name, subTitle: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.productImage !== undefined && { productImage: dto.productImage }),
          ...(dto.architectureBlueprint !== undefined && { architectureBlueprint: dto.architectureBlueprint }),
          ...(dto.initiateAthenionDiscussion !== undefined && { initiateAthenionDiscussion: dto.initiateAthenionDiscussion }),
          ...(dto.productGroupId !== undefined && { productGroupId: dto.productGroupId }),
        },
      });

      if (dto.sectors !== undefined) {
        await tx.productSector.deleteMany({ where: { productId: id } });
        if (dto.sectors.length) {
          await tx.productSector.createMany({
            data: dto.sectors.map((s) => ({
              productId: id,
              sectorType: s.sectorType,
              title: s.title,
              description: s.description ?? null,
              keyFeatures: s.keyFeatures ?? [],
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.product.findUnique({ where: { id }, include: this.includeRelations() });
    });

    this.audit(userId, id, 'UPDATE', existing, updated);
    return this.formatProduct(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID "${id}" not found`);

    await this.prisma.product.delete({ where: { id } });
    this.audit(userId, id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
