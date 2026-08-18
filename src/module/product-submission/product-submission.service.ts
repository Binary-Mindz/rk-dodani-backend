import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TargetDeployTimeline } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductSubmissionDto } from './dto/create-product-submission.dto';
import { QueryProductSubmissionDto } from './dto/query-product-submission.dto';
import { UpdateProductSubmissionDto } from './dto/update-product-submission.dto';

@Injectable()
export class ProductSubmissionService {
  private readonly logger = new Logger(ProductSubmissionService.name);

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
      .catch((err) => {
        this.logger.warn(`Audit log failed: ${err?.message}`);
      });
  }

  private includeProduct() {
    return {
      product: {
        select: {
          id: true,
          title: true,
          subTitle: true,
          module: true,
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
      company: submission.company,
      targetDeployTimeline: submission.targetDeployTimeline,
      useCase: submission.useCase,
      productId: submission.productId,
      product: submission.product ?? null,
      status: submission.status,
      adminNotes: submission.adminNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  async create(dto: CreateProductSubmissionDto) {
    if (!dto.fullName?.trim()) {
      throw new BadRequestException('Full name is required');
    }
    if (!dto.corporateEmail?.trim()) {
      throw new BadRequestException('Corporate email is required');
    }

    const productId = dto.productId && dto.productId.trim().length > 0 ? dto.productId.trim() : null;

    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
    }

    const timeline =
      dto.targetDeployTimeline || TargetDeployTimeline.IMMEDIATE_PILOT_14_DAYS;

    try {
      const created = await this.prisma.productSubmission.create({
        data: {
          fullName: dto.fullName.trim(),
          corporateEmail: dto.corporateEmail.trim(),
          company: dto.company?.trim() ? dto.company.trim() : null,
          targetDeployTimeline: timeline,
          useCase: dto.useCase?.trim() ? dto.useCase.trim() : null,
          productId: productId,
        },
        include: this.includeProduct(),
      });

      this.audit(null, 'PRODUCT_SUBMISSION', created.id, 'CREATE', null, created);
      return this.formatSubmission(created);
    } catch (error: any) {
      this.logger.error('Failed to create product submission', error?.stack || error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error?.message || 'Failed to submit form');
    }
  }

  async findAll(query: QueryProductSubmissionDto) {
    const { search, status, productId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { corporateEmail: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { useCase: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.productSubmission.findMany({
        where,
        skip,
        take: limit,
        include: this.includeProduct(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productSubmission.count({ where }),
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
    const submission = await this.prisma.productSubmission.findUnique({
      where: { id },
      include: this.includeProduct(),
    });
    if (!submission) {
      throw new NotFoundException(
        `Product submission with ID "${id}" not found`,
      );
    }
    return this.formatSubmission(submission);
  }

  async update(
    userId: string | null,
    id: string,
    dto: UpdateProductSubmissionDto,
  ) {
    const existing = await this.prisma.productSubmission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Product submission with ID "${id}" not found`,
      );
    }

    const updated = await this.prisma.productSubmission.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        adminNotes: dto.adminNotes ?? existing.adminNotes,
      },
      include: this.includeProduct(),
    });

    this.audit(userId, 'PRODUCT_SUBMISSION', id, 'UPDATE', existing, updated);
    return this.formatSubmission(updated);
  }

  async remove(userId: string | null, id: string) {
    const existing = await this.prisma.productSubmission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Product submission with ID "${id}" not found`,
      );
    }
    await this.prisma.productSubmission.delete({ where: { id } });
    this.audit(userId, 'PRODUCT_SUBMISSION', id, 'DELETE', existing, null);
    return { success: true, id };
  }
}
