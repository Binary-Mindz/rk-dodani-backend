import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { QueryAdminPageDto } from './dto/query-admin-page.dto';
import { QueryPublicPageDto } from './dto/query-public-page.dto';
import { UpdatePageStatusDto } from './dto/update-page-status.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string | null, dto: CreatePageDto) {
    const existingSlug = await this.prisma.page.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Page slug already exists');
    }

    const page = await this.prisma.page.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        pageType: dto.pageType,
        status: dto.status ?? PublishStatus.DRAFT,
        heroTitle: dto.heroTitle ?? null,
        heroSubtitle: dto.heroSubtitle ?? null,
        heroImageUrl: dto.heroImageUrl ?? null,
        body: dto.body ?? undefined,
        publishedAt:
          dto.status === PublishStatus.PUBLISHED
            ? dto.publishedAt
              ? new Date(dto.publishedAt)
              : new Date()
            : dto.publishedAt
              ? new Date(dto.publishedAt)
              : null,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return page;
  }

  async findAdminAll(query: QueryAdminPageDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PageWhereInput = {
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { subtitle: { contains: query.search, mode: 'insensitive' } },
              { heroTitle: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.pageType ? { pageType: query.pageType } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
          updatedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAdminOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(userId: string | null, id: string, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.page.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Page slug already exists');
      }
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.pageType !== undefined && { pageType: dto.pageType }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.heroTitle !== undefined && { heroTitle: dto.heroTitle }),
        ...(dto.heroSubtitle !== undefined && {
          heroSubtitle: dto.heroSubtitle,
        }),
        ...(dto.heroImageUrl !== undefined && {
          heroImageUrl: dto.heroImageUrl,
        }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.publishedAt !== undefined && {
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        }),
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return updated;
  }

  async updateStatus(userId: string | null, id: string, dto: UpdatePageStatusDto) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    const updateData: Prisma.PageUpdateInput = {
      status: dto.status,
      updatedBy: userId ? { connect: { id: userId } } : undefined,
    };

    if (dto.status === PublishStatus.PUBLISHED) {
      updateData.publishedAt = existing.publishedAt ?? new Date();
    }

    if (
      dto.status === PublishStatus.DRAFT ||
      dto.status === PublishStatus.REVIEW
    ) {
      updateData.publishedAt = null;
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        updatedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    await this.prisma.page.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async findPublicBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        pageType: true,
        status: true,
        heroTitle: true,
        heroSubtitle: true,
        heroImageUrl: true,
        body: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async findPublicAll(query: QueryPublicPageDto) {
    const items = await this.prisma.page.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        ...(query.pageType ? { pageType: query.pageType } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        pageType: true,
        heroTitle: true,
        heroSubtitle: true,
        heroImageUrl: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return items;
  }
}