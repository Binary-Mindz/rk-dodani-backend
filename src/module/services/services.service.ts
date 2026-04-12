import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Service slug already exists');
    }

    return this.prisma.service.create({
      data: {
        ...dto,
        createdById: userId,
        updatedById: userId,
        publishedAt: dto.status === PublishStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        icon: true,
        coverImage: true,
      },
    });
  }

  async findAll(query: ServiceQueryDto, onlyPublished = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      ...(onlyPublished
        ? { status: PublishStatus.PUBLISHED }
        : query.status
          ? { status: query.status }
          : {}),
      ...(typeof query.isFeatured === 'boolean'
        ? { isFeatured: query.isFeatured }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { shortDescription: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          icon: true,
          coverImage: true,
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
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

  async findBySlug(slug: string, onlyPublished = false) {
    const service = await this.prisma.service.findFirst({
      where: {
        slug,
        ...(onlyPublished ? { status: PublishStatus.PUBLISHED } : {}),
      },
      include: {
        icon: true,
        coverImage: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(serviceId: string, userId: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...dto,
        updatedById: userId,
        publishedAt:
          dto.status === PublishStatus.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
      include: {
        icon: true,
        coverImage: true,
      },
    });
  }

  async remove(serviceId: string) {
    const existing = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.service.delete({
      where: { id: serviceId },
    });
  }
}