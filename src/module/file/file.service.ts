import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async getFiles(skip = 0, take = 10) {
    const [files, total] = await Promise.all([
      this.prisma.fileInstance.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fileInstance.count(),
    ]);

    return { files, total };
  }

  async getFile(id: string) {
    const file = await this.prisma.fileInstance.findUnique({
      where: { id },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }
}