import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class CategoryService {
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

  // Name থেকে Slug তৈরি করার হেল্পার ফাংশন
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException(
        'Category already exist with the same name',
      );
    }

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.audit(null, 'CATEGORY', created.id, 'CREATE', undefined, {
      name: dto.name,
    });
    return created;
  }

  async findAll(query: QueryCategoryDto) {
    return this.prisma.category.findMany({
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
    const category = await this.prisma.category.findUnique({
      where: { id },
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

    let slug = existing.slug;

    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);

      const slugExists = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new BadRequestException(
          'Category slug already exists (generated from updated name)',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.audit(
      null,
      'CATEGORY',
      id,
      'UPDATE',
      { name: existing.name },
      { name: updated.name },
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        contentItems: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing.contentItems.length > 0) {
      throw new BadRequestException(
        'Cannot delete category that is already used in content',
      );
    }

    this.audit(
      null,
      'CATEGORY',
      id,
      'DELETE',
      { name: existing.name },
      undefined,
    );
    await this.prisma.category.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
