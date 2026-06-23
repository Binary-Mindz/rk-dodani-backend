import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) { }

  // Name থেকে Slug তৈরি করার হেল্পার ফাংশন
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // স্পেশাল ক্যারেক্টার রিমুভ করবে
      .replace(/[\s_-]+/g, '-') // স্পেস এবং আন্ডারস্কোরকে হাইফেন দিয়ে রিপ্লেস করবে
      .replace(/^-+|-+$/g, ''); // শুরুর বা শেষের বাড়তি হাইফেন বাদ দেবে
  }

  async create(dto: CreateTagDto) {
    // নাম থেকে অটোমেটিক স্লাগ তৈরি
    const slug = this.generateSlug(dto.name);

    // স্লাগটি ইউনিক কিনা চেক করা
    const existingSlug = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Tag slug already exists (generated from name)');
    }

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });
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
        throw new BadRequestException('Tag slug already exists (generated from updated name)');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
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
      throw new BadRequestException('Cannot delete tag associated with content items');
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return { deleted: true };
  }
}