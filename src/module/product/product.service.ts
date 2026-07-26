import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateTargetClientDto } from './dto/create-target-client.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateTargetClientDto } from './dto/update-target-client.dto';

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

  async create(userId: string | null, dto: CreateProductDto) {
    const created = await this.prisma.product.create({
      data: {
        title: dto.title,
        subTitle: dto.subTitle,
        role: dto.role,
        module: dto.module ?? null,
        description: dto.description,
        migrationVector: dto.migrationVector ?? null,
        scaleValueImpact: dto.scaleValueImpact ?? null,
        targetClient: dto.targetClient?.length
          ? {
              create: dto.targetClient.map((targetClient) => ({
                type: targetClient.type,
                title: targetClient.title,
                description: targetClient.description ?? null,
                image: targetClient.image ?? null,
                keyFeature: targetClient.keyFeature ?? [],
              })),
            }
          : undefined,
      },
      include: { targetClient: true },
    });

    this.audit(userId, 'PRODUCT', created.id, 'CREATE', null, created);
    return created;
  }

  async findAll(query: QueryProductDto, publicOnly = false) {
    const { search, role, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(publicOnly && { isActive: true }),
      ...(isActive !== undefined && !publicOnly && { isActive }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { subTitle: { contains: search, mode: 'insensitive' } },
          { module: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { migrationVector: { contains: search, mode: 'insensitive' } },
          { scaleValueImpact: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { targetClient: true },
        orderBy: { title: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
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
      include: { targetClient: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async update(userId: string | null, id: string, dto: UpdateProductDto) {
    const existing = await this.findOne(id);
    const { targetClient, ...productData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(productData).length > 0) {
        await tx.product.update({
          where: { id },
          data: productData,
        });
      }

      if (targetClient !== undefined) {
        await tx.targetClient.deleteMany({
          where: { productId: id },
        });

        const validTargetClients = targetClient.filter(
          (client): client is CreateTargetClientDto =>
            typeof client.title === 'string' && client.title.trim().length > 0,
        );

        if (validTargetClients.length > 0) {
          await tx.targetClient.createMany({
            data: validTargetClients.map((client) => ({
              type: client.type,
              title: client.title,
              description: client.description ?? null,
              image: client.image ?? null,
              keyFeature: client.keyFeature ?? [],
              productId: id,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { targetClient: true },
      });
    });

    this.audit(userId, 'PRODUCT', id, 'UPDATE', existing, updated);
    return updated;
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    this.audit(userId, 'PRODUCT', id, 'DELETE', existing, null);
    return { success: true, id };
  }

  async addTargetClient(
    userId: string | null,
    productId: string,
    dto: CreateTargetClientDto,
  ) {
    await this.findOne(productId);

    const created = await this.prisma.targetClient.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        image: dto.image ?? null,
        keyFeature: dto.keyFeature ?? [],
        productId,
      },
    });

    this.audit(userId, 'TARGET_CLIENT', created.id, 'CREATE', null, created);
    return created;
  }

  async updateTargetClient(
    userId: string | null,
    id: string,
    dto: UpdateTargetClientDto,
  ) {
    const existing = await this.prisma.targetClient.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`TargetClient with ID "${id}" not found`);
    }

    const updated = await this.prisma.targetClient.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.keyFeature !== undefined && { keyFeature: dto.keyFeature }),
      },
    });

    this.audit(userId, 'TARGET_CLIENT', id, 'UPDATE', existing, updated);
    return updated;
  }

  async removeTargetClient(userId: string | null, id: string) {
    const existing = await this.prisma.targetClient.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`TargetClient with ID "${id}" not found`);
    }

    await this.prisma.targetClient.delete({
      where: { id },
    });

    this.audit(userId, 'TARGET_CLIENT', id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
