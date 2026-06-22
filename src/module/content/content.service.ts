import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryAdminContentDto } from './dto/query-admin-content.dto';
import { QueryPublicContentDto } from './dto/query-public-content.dto';
import { UpdateContentStatusDto } from './dto/update-content-status.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) { }

  private serializeBigInt(data: any) {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }


  /**
   * ✅ Core validation logic for micro-relations
   */
  private async validateRelations(dto: {
    contentTypeId?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }) {
    if (dto.contentTypeId) {
      const contentType = await this.prisma.contentType.findUnique({
        where: { id: dto.contentTypeId },
      });
      if (!contentType) {
        throw new BadRequestException('Content type not found');
      }
    }

    if (dto.categoryIds?.length) {
      const count = await this.prisma.category.count({
        where: { id: { in: dto.categoryIds } },
      });
      if (count !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categories are invalid');
      }
    }

    if (dto.tagIds?.length) {
      const count = await this.prisma.tag.count({
        where: { id: { in: dto.tagIds } },
      });
      if (count !== dto.tagIds.length) {
        throw new BadRequestException('One or more tags are invalid');
      }
    }
  }

  async create(userId: string, dto: CreateContentDto) {
    const existingSlug = await this.prisma.contentItem.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Content slug already exists');
    }

    await this.validateRelations(dto);

    const created = await this.prisma.$transaction(async (tx) => {
      const content = await tx.contentItem.create({
        data: {
          contentTypeId: dto.contentTypeId,
          slug: dto.slug,
          title: dto.title,
          subtitle: dto.subtitle ?? null,
          excerpt: dto.excerpt ?? null,
          summary: dto.summary ?? null,
          plainTextBody: dto.plainTextBody ?? null,
          authorDisplayName: dto.authorDisplayName ?? null,
          coverImageUrl: dto.coverImageUrl ?? null,
          thumbnailUrl: dto.thumbnailUrl ?? null,
          status: dto.status ?? PublishStatus.DRAFT,
          visibility: dto.visibility ?? 'PUBLIC',
          accessModel: dto.accessModel ?? 'PUBLIC',
          contentFormat: dto.contentFormat ?? null,
          externalUrl: dto.externalUrl ?? null,
          externalEmbedCode: dto.externalEmbedCode ?? null,
          readingTimeMinutes: dto.readingTimeMinutes ?? null,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          isFeatured: dto.isFeatured ?? false,
          isPinned: dto.isPinned ?? false,
          allowComments: dto.allowComments ?? false,
          sortOrder: dto.sortOrder ?? 0,
          createdById: userId,
          updatedById: userId,

          // 📂 Merged Asset Core Properties
          fileUrl: dto.fileUrl ?? null,
          isDownloadable: dto.isDownloadable ?? true,
          downloadRequiresAcceptance: dto.downloadRequiresAcceptance ?? false,
          termsText: dto.termsText ?? null,

          ...(dto.status === PublishStatus.PUBLISHED && {
            publishedAt: new Date(),
            publishedById: userId,
          }),
        },
      });

      if (dto.categoryIds?.length) {
        await tx.contentCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            contentItemId: content.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (dto.tagIds?.length) {
        await tx.contentTag.createMany({
          data: dto.tagIds.map((tagId) => ({
            contentItemId: content.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      return content;
    });

    return this.findAdminOne(created.id);
  }

  async findAdminAll(query: QueryAdminContentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentItemWhereInput = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { excerpt: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.accessModel && { accessModel: query.accessModel }),
      ...(query.contentTypeId && { contentTypeId: query.contentTypeId }),
      ...(typeof query.isFeatured === 'boolean' && { isFeatured: query.isFeatured }),
      ...(typeof query.isPinned === 'boolean' && { isPinned: query.isPinned }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contentItem.findMany({
        where,
        include: {
          contentType: true,
          contentCategories: { include: { category: true } },
          contentTags: { include: { tag: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return this.serializeBigInt({
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  async findAdminOne(id: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        contentType: true,
        contentCategories: { include: { category: true } },
        contentTags: { include: { tag: true } },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.serializeBigInt(content);
  }

  async update(userId: string, id: string, dto: UpdateContentDto) {
    const existing = await this.prisma.contentItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.contentItem.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new BadRequestException('Content slug already exists');
      }
    }

    await this.validateRelations(dto);

    await this.prisma.$transaction(async (tx) => {
      await tx.contentItem.update({
        where: { id },
        data: {
          ...(dto.contentTypeId !== undefined && { contentTypeId: dto.contentTypeId }),
          ...(dto.slug !== undefined && { slug: dto.slug }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
          ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
          ...(dto.summary !== undefined && { summary: dto.summary }),
          ...(dto.plainTextBody !== undefined && { plainTextBody: dto.plainTextBody }),
          ...(dto.authorDisplayName !== undefined && { authorDisplayName: dto.authorDisplayName }),
          ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
          ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.visibility !== undefined && { visibility: dto.visibility }),
          ...(dto.accessModel !== undefined && { accessModel: dto.accessModel }),
          ...(dto.contentFormat !== undefined && { contentFormat: dto.contentFormat }),
          ...(dto.externalUrl !== undefined && { externalUrl: dto.externalUrl }),
          ...(dto.externalEmbedCode !== undefined && { externalEmbedCode: dto.externalEmbedCode }),
          ...(dto.readingTimeMinutes !== undefined && { readingTimeMinutes: dto.readingTimeMinutes }),
          ...(dto.scheduledAt !== undefined && { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }),
          ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
          ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
          ...(dto.allowComments !== undefined && { allowComments: dto.allowComments }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),

          // 📂 Merged Asset Inline Update Fields
          ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
          ...(dto.isDownloadable !== undefined && { isDownloadable: dto.isDownloadable }),
          ...(dto.downloadRequiresAcceptance !== undefined && { downloadRequiresAcceptance: dto.downloadRequiresAcceptance }),
          ...(dto.termsText !== undefined && { termsText: dto.termsText }),

          updatedById: userId,
        },
      });

      if (dto.categoryIds) {
        await tx.contentCategory.deleteMany({ where: { contentItemId: id } });
        if (dto.categoryIds.length) {
          await tx.contentCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({ contentItemId: id, categoryId })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.tagIds) {
        await tx.contentTag.deleteMany({ where: { contentItemId: id } });
        if (dto.tagIds.length) {
          await tx.contentTag.createMany({
            data: dto.tagIds.map((tagId) => ({ contentItemId: id, tagId })),
            skipDuplicates: true,
          });
        }
      }
    });

    return this.findAdminOne(id);
  }

  async updateStatus(userId: string, id: string, dto: UpdateContentStatusDto) {
    const existing = await this.prisma.contentItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }

    const updateData: Prisma.ContentItemUpdateInput = {
      status: dto.status,
    };

    if (dto.status === PublishStatus.PUBLISHED) {
      updateData.publishedAt = existing.publishedAt ?? new Date();
      updateData.archivedAt = null;
    } else if (dto.status === PublishStatus.ARCHIVED) {
      updateData.archivedAt = new Date();
    } else {
      updateData.archivedAt = null;
    }

    await this.prisma.contentItem.update({ where: { id }, data: updateData });
    return this.findAdminOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.contentItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  async findPublicAll(query: QueryPublicContentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentItemWhereInput = {
      deletedAt: null,
      status: PublishStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { excerpt: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.categorySlug && {
        contentCategories: { some: { category: { slug: query.categorySlug } } },
      }),
      ...(query.tagSlug && {
        contentTags: { some: { tag: { slug: query.tagSlug } } },
      }),
      // ⚡ নতুন লজিক: এক বা একাধিক contentTypeId দিয়ে filtering করার জন্য
      ...(query.contentTypeIds && query.contentTypeIds.length > 0 && {
        contentTypeId: { in: query.contentTypeIds },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contentItem.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          excerpt: true,
          summary: true,
          authorDisplayName: true,
          coverImageUrl: true,
          thumbnailUrl: true,
          publishedAt: true,
          isFeatured: true,
          isPinned: true,
          readingTimeMinutes: true,
          contentType: true,
          fileUrl: true,
          isDownloadable: true,
          contentCategories: { include: { category: true } },
          contentTags: { include: { tag: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { isFeatured: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return this.serializeBigInt({
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }



  async findPublicBySlug(slug: string) {
    const content = await this.prisma.contentItem.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      include: {
        contentType: true,
        contentCategories: { include: { category: true } },
        contentTags: { include: { tag: true } },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id: content.id },
      data: { viewCount: { increment: 1 } },
    });

    return this.serializeBigInt(content);
  }
}