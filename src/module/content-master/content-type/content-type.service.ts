import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContentTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.contentType.findMany({
      orderBy: { name: 'asc' },
    });
  }
}