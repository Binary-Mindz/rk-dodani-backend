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

  // Name থেকে Slug তৈরি করার হেল্পার ফাংশন
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // স্পেশাল ক্যারেক্টার রিমুভ করবে
      .replace(/[\s_-]+/g, '-') // স্পেস এবং আন্ডারস্কোরকে হাইফেন দিয়ে রিপ্লেস করবে
      .replace(/^-+|-+$/g, ''); // সুরুর বা শেষের বাড়তি হাইফেন বাদ দেবে
  }

  async create(dto: CreateCategoryDto) {
    // অটোমেটিকভাবে স্লাগ জেনারেট করা হচ্ছে
    const slug = this.generateSlug(dto.name);

    // চেক করা হচ্ছে এই স্লাগটি ইতিমধ্যে ডাটাবেজে আছে কিনা
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Category slug already exists (generated from name)');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description ?? null,
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
      // নতুন মডেল অনুযায়ী displayOrder বাদ দিয়ে শুধু name দিয়ে সর্ট করা হয়েছে
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
    
    // যদি আপডেট করার সময় নাম পরিবর্তন করা হয়, তবে স্লাগও নতুন করে জেনারেট হবে
    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);

      const slugExists = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new BadRequestException('Category slug already exists (generated from updated name)');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        contentItems: true, // আপনার নতুন মডেলের ContentCategory রিলেশন
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

    await this.prisma.category.delete({
      where: { id },
    });

    return { deleted: true };
  }
}