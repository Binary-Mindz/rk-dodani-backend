import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Category slug already exists');
    }

    if (dto.parentCategoryId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentCategoryId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        parentCategoryId: dto.parentCategoryId ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: QueryCategoryDto) {
    return this.prisma.category.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { slug: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        childCategories: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parentCategory: true,
        childCategories: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Category slug already exists');
      }
    }

    if (dto.parentCategoryId) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentCategoryId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentCategoryId !== undefined && {
          parentCategoryId: dto.parentCategoryId,
        }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        childCategories: true,
        contentItems: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing.childCategories.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with child categories',
      );
    }

    if (existing.contentItems.length > 0) {
      throw new BadRequestException(
        'Cannot delete category that is already used in content',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { deleted: true };
  }
}