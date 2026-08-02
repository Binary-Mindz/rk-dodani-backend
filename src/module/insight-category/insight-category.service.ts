import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInsightCategoryDto } from './dto/create-insight-category.dto';
import { QueryInsightCategoryDto } from './dto/query-insight-category.dto';
import { UpdateInsightCategoryDto } from './dto/update-insight-category.dto';

@Injectable()
export class InsightCategoryService {
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
        entityType: 'INSIGHT_CATEGORY',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateInsightCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.insightCategory.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException(
        'Insight category already exist with the same name',
      );
    }

    const created = await this.prisma.insightCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.audit(null, created.id, 'CREATE', undefined, { name: dto.name });
    return created;
  }

  async findAll(query: QueryInsightCategoryDto) {
    return this.prisma.insightCategory.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { slug: { contains: query.search, mode: 'insensitive' } },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.insightCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Insight category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateInsightCategoryDto) {
    const existing = await this.prisma.insightCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Insight category not found');
    }

    let slug = existing.slug;

    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);

      const slugExists = await this.prisma.insightCategory.findUnique({
        where: { slug },
      });

      if (slugExists && slugExists.id !== id) {
        throw new BadRequestException(
          'Insight category slug already exists (generated from updated name)',
        );
      }
    }

    const updated = await this.prisma.insightCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.audit(
      null,
      id,
      'UPDATE',
      { name: existing.name },
      { name: updated.name },
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.insightCategory.findUnique({
      where: { id },
      include: {
        insightMappings: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Insight category not found');
    }

    if (existing.insightMappings.length > 0) {
      throw new BadRequestException(
        'Cannot delete insight category that is already used in insight',
      );
    }

    this.audit(null, id, 'DELETE', { name: existing.name }, undefined);
    await this.prisma.insightCategory.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
