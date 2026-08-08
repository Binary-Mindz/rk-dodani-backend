import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateServiceSubmissionDto } from './dto/create-service-submission.dto';
import { UpdateServiceSubmissionDto } from './dto/update-service-submission.dto';
import { QueryServiceSubmissionDto } from './dto/query-service-submission.dto';

@Injectable()
export class ServiceSubmissionService {
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

  private includeService() {
    return {
      service: {
        select: {
          id: true,
          title: true,
          heading: true,
          description: true,
        },
      },
    };
  }

  private formatSubmission(submission: any) {
    if (!submission) return submission;
    return {
      id: submission.id,
      fullName: submission.fullName,
      corporateEmail: submission.corporateEmail,
      primaryFocusArea: submission.primaryFocusArea,
      message: submission.message,
      serviceId: submission.serviceId,
      service: submission.service ?? null,
      status: submission.status,
      adminNotes: submission.adminNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  async create(dto: CreateServiceSubmissionDto) {
    if (!dto.fullName?.trim()) {
      throw new BadRequestException('Full name is required');
    }

    if (dto.serviceId) {
      const service = await this.prisma.services.findUnique({ where: { id: dto.serviceId } });
      if (!service) {
        throw new BadRequestException('Service not found');
      }
    }

    const created = await this.prisma.serviceSubmission.create({
      data: {
        fullName: dto.fullName.trim(),
        corporateEmail: dto.corporateEmail.trim(),
        primaryFocusArea: dto.primaryFocusArea,
        message: dto.message ?? null,
        serviceId: dto.serviceId ?? null,
      },
      include: this.includeService(),
    });

    this.audit(null, 'SERVICE_SUBMISSION', created.id, 'CREATE', null, created);
    return this.formatSubmission(created);
  }

  async findAll(query: QueryServiceSubmissionDto) {
    const { search, status, primaryFocusArea, serviceId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(primaryFocusArea && { primaryFocusArea }),
      ...(serviceId && { serviceId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { corporateEmail: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.serviceSubmission.findMany({
        where,
        skip,
        take: limit,
        include: this.includeService(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceSubmission.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatSubmission(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const submission = await this.prisma.serviceSubmission.findUnique({
      where: { id },
      include: this.includeService(),
    });

    if (!submission) {
      throw new NotFoundException(`Service submission with ID "${id}" not found`);
    }

    return this.formatSubmission(submission);
  }

  async update(userId: string | null, id: string, dto: UpdateServiceSubmissionDto) {
    const existing = await this.prisma.serviceSubmission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Service submission with ID "${id}" not found`);
    }


    const updated = await this.prisma.serviceSubmission.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        adminNotes: dto.adminNotes ?? existing.adminNotes,
      },
      include: this.includeService(),
    });

    this.audit(userId, 'SERVICE_SUBMISSION', id, 'UPDATE', existing, updated);
    return this.formatSubmission(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.prisma.serviceSubmission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Service submission with ID "${id}" not found`);
    }

    await this.prisma.serviceSubmission.delete({ where: { id } });
    this.audit(userId, 'SERVICE_SUBMISSION', id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
