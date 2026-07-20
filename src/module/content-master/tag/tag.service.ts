import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class TagService {
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateTagDto) {
    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Tag already exist with the same name');
    }

    const created = await this.prisma.tag.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.audit(null, 'TAG', created.id, 'CREATE', undefined, {
      name: dto.name,
    });
    return created;
  }

  async findAll(query: QueryTagDto) {
    return this.prisma.tag.findMany({
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
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    let slug = existing.slug;

    // যদি আপডেট করার সময় নাম পরিবর্তন করা হয়, তবে স্লাগও নতুন করে জেনারেট ও চেক হবে
    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);

      const slugExists = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new BadRequestException(
          'Tag slug already exists (generated from updated name)',
        );
      }
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    this.audit(
      null,
      'TAG',
      id,
      'UPDATE',
      { name: existing.name },
      { name: updated.name },
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        contentTags: true, // নতুন মডেলের রিলেশন অনুযায়ী
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    if (existing.contentTags.length > 0) {
      throw new BadRequestException(
        'Cannot delete tag associated with content items',
      );
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    this.audit(null, 'TAG', id, 'DELETE', { name: existing.name }, undefined);
    return { deleted: true };
  }
}
