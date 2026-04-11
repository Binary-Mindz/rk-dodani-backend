import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';


@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleByCode(code: UserRoleCode) {
    const role = await this.prisma.role.findUnique({
      where: { code },
    });

    if (!role) {
      throw new NotFoundException(`Role ${code} not found`);
    }

    return role;
  }
}