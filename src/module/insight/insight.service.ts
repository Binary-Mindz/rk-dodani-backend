import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InsightStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInsightDto } from './dto/create-insight.dto';
import { UpdateInsightDto } from './dto/update-insight.dto';
import { UpdateInsightStatusDto } from './dto/update-insight-status.dto';
import { QueryInsightDto } from './dto/query-insight.dto';

@Injectable()
export class InsightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private audit(
    actorUserId: string | null,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ARCHIVE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType: 'INSIGHT',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  private includeRelations() {
    return {
      categories: { include: { category: true } },
    };
  }

  private normalizeTags(tags?: string[]) {
    if (!tags?.length) return [];
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  async create(userId: string, dto: CreateInsightDto) {
    const slug = this.generateSlug(dto.title);

    const existing = await this.prisma.insight.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Insight with same title already exists');

    if (dto.categoryIds?.length) {
      const count = await this.prisma.insightCategory.count({ where: { id: { in: dto.categoryIds } } });
      if (count !== dto.categoryIds.length) throw new BadRequestException('One or more insight categories are invalid');
    }

    const tags = this.normalizeTags(dto.tags);

    const created = await this.prisma.$transaction(async (tx) => {
      const insight = await tx.insight.create({
        data: {
          slug,
          title: dto.title,
          subtitle: dto.subtitle ?? null,
          excerpt: dto.excerpt ?? null,
          summary: dto.summary ?? null,
          readingTimeMinutes: dto.readingTimeMinutes ?? null,
          coverImageUrl: dto.coverImageUrl ?? null,
          externalUrl: dto.externalUrl ?? null,
          status: dto.status ?? InsightStatus.DRAFT,
          visibility: dto.visibility ?? 'PUBLIC',
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          allowComments: dto.allowComments ?? false,
          allowDownload: dto.allowDownload ?? false,
          contentType: dto.contentType ?? 'ARTICLE',
          fileType: dto.fileType ?? null,
          industryTargets: dto.industryTargets ?? [],
          tags,
        },
      });

      if (dto.categoryIds?.length) {
        await tx.insightCategoryMap.createMany({
          data: dto.categoryIds.map((categoryId) => ({ insightId: insight.id, categoryId })),
          skipDuplicates: true,
        });
      }

      return insight;
    });

    this.audit(userId, created.id, 'CREATE', undefined, { title: dto.title, status: dto.status });
    return this.findOne(created.id);
  }

  async findAll(query: QueryInsightDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InsightWhereInput = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { excerpt: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.contentType && { contentType: query.contentType }),
      ...(query.industry && {
        industryTargets: { has: query.industry },
      }),
      ...(query.categoryId && {
        categories: { some: { categoryId: query.categoryId } },
      }),
      ...(query.tag && {
        tags: { has: query.tag },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.insight.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.insight.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const insight = await this.prisma.insight.findFirst({
      where: { id, deletedAt: null },
      include: this.includeRelations(),
    });

    if (!insight) throw new NotFoundException('Insight not found');
    return insight;
  }

  async update(userId: string, id: string, dto: UpdateInsightDto) {
    const existing = await this.prisma.insight.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Insight not found');

    let slug = existing.slug;
    if (dto.title && dto.title !== existing.title) {
      slug = this.generateSlug(dto.title);
      const slugExists = await this.prisma.insight.findUnique({ where: { slug } });
      if (slugExists && slugExists.id !== id) throw new BadRequestException('Slug already exists');
    }

    if (dto.categoryIds?.length) {
      const count = await this.prisma.insightCategory.count({ where: { id: { in: dto.categoryIds } } });
      if (count !== dto.categoryIds.length) throw new BadRequestException('One or more insight categories are invalid');
    }

    const tags = this.normalizeTags(dto.tags);

    await this.prisma.$transaction(async (tx) => {
      await tx.insight.update({
        where: { id },
        data: {
          slug,
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
          ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
          ...(dto.summary !== undefined && { summary: dto.summary }),
          ...(dto.readingTimeMinutes !== undefined && { readingTimeMinutes: dto.readingTimeMinutes }),
          ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
          ...(dto.externalUrl !== undefined && { externalUrl: dto.externalUrl }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.visibility !== undefined && { visibility: dto.visibility }),
          ...(dto.scheduledAt !== undefined && { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }),
          ...(dto.allowComments !== undefined && { allowComments: dto.allowComments }),
          ...(dto.allowDownload !== undefined && { allowDownload: dto.allowDownload }),
          ...(dto.contentType !== undefined && { contentType: dto.contentType }),
          ...(dto.fileType !== undefined && { fileType: dto.fileType }),
          ...(dto.industryTargets !== undefined && { industryTargets: dto.industryTargets }),
          ...(dto.tags !== undefined && { tags }),
        },
      });

      if (dto.categoryIds !== undefined) {
        await tx.insightCategoryMap.deleteMany({ where: { insightId: id } });
        if (dto.categoryIds.length) {
          await tx.insightCategoryMap.createMany({
            data: dto.categoryIds.map((categoryId) => ({ insightId: id, categoryId })),
            skipDuplicates: true,
          });
        }
      }
    });

    this.audit(userId, id, 'UPDATE', { title: existing.title, status: existing.status }, { title: dto.title, status: dto.status });
    return this.findOne(id);
  }

  async updateStatus(userId: string, id: string, dto: UpdateInsightStatusDto) {
    const existing = await this.prisma.insight.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Insight not found');

    await this.prisma.insight.update({ where: { id }, data: { status: dto.status } });

    const action =
      dto.status === InsightStatus.PUBLISHED ? 'PUBLISH' :
      dto.status === InsightStatus.ARCHIVED ? 'ARCHIVE' : 'UPDATE';

    this.audit(userId, id, action as any, { status: existing.status }, { status: dto.status });
    return this.findOne(id);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.insight.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Insight not found');

    await this.prisma.insight.update({ where: { id }, data: { deletedAt: new Date() } });
    this.audit(userId, id, 'DELETE', { title: existing.title }, undefined);
    return { deleted: true };
  }
}
