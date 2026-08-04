import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateNavLinkDto } from './dto/update-nav-link.dto';

@Injectable()
export class NavLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const record = await this.prisma.customNavLink.findFirst();
    if (!record) throw new NotFoundException('Nav link config not found');
    return record;
  }

  async update(dto: UpdateNavLinkDto) {
    const existing = await this.prisma.customNavLink.findFirst();

    if (!existing) {
      return this.prisma.customNavLink.create({ data: { ...dto } });
    }

    return this.prisma.customNavLink.update({
      where: { id: existing.id },
      data: { ...dto },
    });
  }
}
