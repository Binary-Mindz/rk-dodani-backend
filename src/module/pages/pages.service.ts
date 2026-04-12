import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { CreatePageDto } from './dto/create-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePageDto) {
    const existing = await this.prisma.page.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Page slug already exists');
    }

    return this.prisma.page.create({
      data: {
        ...dto,
        createdById: userId,
        updatedById: userId,
        publishedAt: dto.status === PublishStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        heroImage: true,
      },
    });
  }

  async findAll(query: PageQueryDto, onlyPublished = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PageWhereInput = {
      ...(query.pageType ? { pageType: query.pageType } : {}),
      ...(onlyPublished
        ? { status: PublishStatus.PUBLISHED }
        : query.status
          ? { status: query.status }
          : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        include: { heroImage: true },
        orderBy: { createdAt: 'desc' },
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

  async findBySlug(slug: string, onlyPublished = false) {
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        ...(onlyPublished ? { status: PublishStatus.PUBLISHED } : {}),
      },
      include: {
        heroImage: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(pageId: string, userId: string, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    return this.prisma.page.update({
      where: { id: pageId },
      data: {
        ...dto,
        updatedById: userId,
        publishedAt:
          dto.status === PublishStatus.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
      include: {
        heroImage: true,
      },
    });
  }

  async remove(pageId: string) {
    const existing = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!existing) {
      throw new NotFoundException('Page not found');
    }

    return this.prisma.page.delete({
      where: { id: pageId },
    });
  }
}