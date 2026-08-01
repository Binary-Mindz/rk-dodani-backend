import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

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

  private includeRelations() {
    return {
      serviceGroup: true,
    };
  }

  private formatService(service: any) {
    if (!service) return service;
    return {
      id: service.id,
      name: service.title,
      description: service.description,
      serviceGroupId: service.serviceGroupId,
      serviceGroup: service.serviceGroup
        ? {
            id: service.serviceGroup.id,
            name: service.serviceGroup.name,
            description: service.serviceGroup.description,
            icon: service.serviceGroup.icon,
          }
        : null,
      criticalFriction: service.criticalFriction,
      agentarumParadigm: service.agentarumParadigm,
      hardTangibleDeliverables: service.hardTangibleDeliverables,
    };
  }

  private async validateServiceGroupId(serviceGroupId?: string | null) {
    if (!serviceGroupId) return;
    const serviceGroup = await this.prisma.serviceGroup.findUnique({ where: { id: serviceGroupId } });
    if (!serviceGroup) {
      throw new BadRequestException('Service group not found');
    }
  }

  async create(userId: string | null, dto: CreateServiceDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Service name is required');
    }

    await this.validateServiceGroupId(dto.serviceGroupId);

    const created = await this.prisma.services.create({
      data: {
        title: dto.name,
        heading: dto.name,
        description: dto.description ?? null,
        criticalFriction: dto.criticalFriction ?? null,
        agentarumParadigm: dto.agentarumParadigm ?? null,
        hardTangibleDeliverables: dto.hardTangibleDeliverables ?? null,
        serviceGroupId: dto.serviceGroupId ?? null,
      },
      include: this.includeRelations(),
    });

    this.audit(userId, 'SERVICES', created.id, 'CREATE', null, created);
    return this.formatService(created);
  }

  async findAll(query: QueryServiceDto) {
    const { search, serviceGroupId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(serviceGroupId && { serviceGroupId }),
      ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { heading: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { criticalFriction: { contains: search, mode: 'insensitive' } },
            { agentarumParadigm: { contains: search, mode: 'insensitive' } },
            { hardTangibleDeliverables: { contains: search, mode: 'insensitive' } },
          ],
        }),
    };

    const [items, total] = await Promise.all([
      this.prisma.services.findMany({
        where,
        skip,
        take: limit,
        include: this.includeRelations(),
      }),
      this.prisma.services.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatService(item)),
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
      include: this.includeRelations(),
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    return this.formatService(service);
  }

  async update(userId: string | null, id: string, dto: UpdateServiceDto) {
    const existing = await this.findOne(id);
    await this.validateServiceGroupId(dto.serviceGroupId);

    const { name, ...serviceData } = dto;
    const mappedServiceData = {
      ...serviceData,
      ...(name !== undefined && { title: name, heading: name }),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(mappedServiceData).length > 0) {
        await tx.services.update({
          where: { id },
          data: mappedServiceData,
        });
      }

      return tx.services.findUnique({
        where: { id },
        include: this.includeRelations(),
      });
    });

    this.audit(userId, 'SERVICES', id, 'UPDATE', existing, updated);
    return this.formatService(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.findOne(id);

    await this.prisma.services.delete({
      where: { id },
    });

    this.audit(userId, 'SERVICES', id, 'DELETE', existing, null);
    return { success: true, id };
  }

}
