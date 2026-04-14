import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryAdminServiceDto } from './dto/query-admin-service.dto';
import { QueryPublicServiceDto } from './dto/query-public-service.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly reservedSlugs = [
    'admin',
    'auth',
    'billing',
    'content',
    'plans',
    'patreon',
    'pages',
    'services',
  ];

  private validateSlug(slug: string) {
    if (this.reservedSlugs.includes(slug.trim().toLowerCase())) {
      throw new BadRequestException('This service slug is reserved');
    }
  }

  async create(userId: string | null, dto: CreateServiceDto) {
    this.validateSlug(dto.slug);

    const existingSlug = await this.prisma.service.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Service slug already exists');
    }

    return this.prisma.service.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        iconUrl: dto.iconUrl ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isFeatured: dto.isFeatured ?? false,
        status: dto.status ?? PublishStatus.DRAFT,
        ctaLabel: dto.ctaLabel ?? null,
        ctaUrl: dto.ctaUrl ?? null,
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
  }

  async findAdminAll(query: QueryAdminServiceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              {
                shortDescription: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(typeof query.isFeatured === 'boolean'
        ? { isFeatured: query.isFeatured }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
          updatedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
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
    const service = await this.prisma.service.findUnique({
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

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(userId: string | null, id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      this.validateSlug(dto.slug);

      const slugExists = await this.prisma.service.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Service slug already exists');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.shortDescription !== undefined && {
          shortDescription: dto.shortDescription,
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
        ...(dto.coverImageUrl !== undefined && {
          coverImageUrl: dto.coverImageUrl,
        }),
        ...(dto.displayOrder !== undefined && {
          displayOrder: dto.displayOrder,
        }),
        ...(dto.isFeatured !== undefined && {
          isFeatured: dto.isFeatured,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.ctaLabel !== undefined && { ctaLabel: dto.ctaLabel }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl }),
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
  }

  async updateStatus(
    userId: string | null,
    id: string,
    dto: UpdateServiceStatusDto,
  ) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    const updateData: Prisma.ServiceUpdateInput = {
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

    return this.prisma.service.update({
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
  }

  async remove(id: string) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async findPublicAll(query: QueryPublicServiceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      status: PublishStatus.PUBLISHED,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                shortDescription: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(typeof query.isFeatured === 'boolean'
        ? { isFeatured: query.isFeatured }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          iconUrl: true,
          coverImageUrl: true,
          displayOrder: true,
          isFeatured: true,
          status: true,
          ctaLabel: true,
          ctaUrl: true,
          publishedAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
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

  async findPublicBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        description: true,
        iconUrl: true,
        coverImageUrl: true,
        displayOrder: true,
        isFeatured: true,
        status: true,
        ctaLabel: true,
        ctaUrl: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}