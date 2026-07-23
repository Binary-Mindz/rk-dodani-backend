import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { CreateDeepPointDto } from './dto/create-deep-point.dto';
import { UpdateDeepPointDto } from './dto/update-deep-point.dto';

@Injectable()
export class ServiceService {
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

  async create(userId: string | null, dto: CreateServiceDto) {
    const created = await this.prisma.services.create({
      data: {
        title: dto.title,
        heading: dto.heading,
        description: dto.description ?? null,
        deepPoints: dto.deepPoints?.length
          ? {
              create: dto.deepPoints.map((dp) => ({
                title: dp.title,
                description: dp.description ?? null,
                criticalFriction: dp.criticalFriction ?? null,
                paradigm: dp.paradigm ?? null,
                keyFeatures: dp.keyFeatures ?? [],
              })),
            }
          : undefined,
      },
      include: {
        deepPoints: true,
      },
    });

    this.audit(userId, 'SERVICES', created.id, 'CREATE', null, created);
    return created;
  }

  async findAll(query: QueryServiceDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { heading: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.services.findMany({
        where,
        skip,
        take: limit,
        include: {
          deepPoints: true,
        },
      }),
      this.prisma.services.count({ where }),
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
    const service = await this.prisma.services.findUnique({
      where: { id },
      include: {
        deepPoints: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    return service;
  }

  async update(userId: string | null, id: string, dto: UpdateServiceDto) {
    const existing = await this.findOne(id);

    const { deepPoints, ...serviceData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(serviceData).length > 0) {
        await tx.services.update({
          where: { id },
          data: serviceData,
        });
      }

      if (deepPoints !== undefined) {
        await tx.deepPoint.deleteMany({
          where: { serviceId: id },
        });

        const validDeepPoints = deepPoints.filter(
          (dp): dp is typeof dp & { title: string } => typeof dp.title === 'string' && dp.title.trim().length > 0,
        );

        if (validDeepPoints.length > 0) {
          await tx.deepPoint.createMany({
            data: validDeepPoints.map((dp) => ({
              title: dp.title,
              description: dp.description ?? null,
              criticalFriction: dp.criticalFriction ?? null,
              paradigm: dp.paradigm ?? null,
              keyFeatures: dp.keyFeatures ?? [],
              serviceId: id,
            })),
          });
        }
      }

      return tx.services.findUnique({
        where: { id },
        include: { deepPoints: true },
      });
    });

    this.audit(userId, 'SERVICES', id, 'UPDATE', existing, updated);
    return updated;
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);

    await this.prisma.services.delete({
      where: { id },
    });

    this.audit(userId, 'SERVICES', id, 'DELETE', existing, null);
    return { success: true, id };
  }

  async addDeepPoint(userId: string | null, serviceId: string, dto: CreateDeepPointDto) {
    await this.findOne(serviceId);

    const created = await this.prisma.deepPoint.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        criticalFriction: dto.criticalFriction ?? null,
        paradigm: dto.paradigm ?? null,
        keyFeatures: dto.keyFeatures ?? [],
        serviceId,
      },
    });

    this.audit(userId, 'DEEP_POINT', created.id, 'CREATE', null, created);
    return created;
  }

  async updateDeepPoint(userId: string | null, id: string, dto: UpdateDeepPointDto) {
    const existing = await this.prisma.deepPoint.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`DeepPoint with ID "${id}" not found`);
    }

    const updated = await this.prisma.deepPoint.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.criticalFriction !== undefined && { criticalFriction: dto.criticalFriction }),
        ...(dto.paradigm !== undefined && { paradigm: dto.paradigm }),
        ...(dto.keyFeatures !== undefined && { keyFeatures: dto.keyFeatures }),
      },
    });

    this.audit(userId, 'DEEP_POINT', id, 'UPDATE', existing, updated);
    return updated;
  }

  async removeDeepPoint(userId: string | null, id: string) {
    const existing = await this.prisma.deepPoint.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`DeepPoint with ID "${id}" not found`);
    }

    await this.prisma.deepPoint.delete({
      where: { id },
    });

    this.audit(userId, 'DEEP_POINT', id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
