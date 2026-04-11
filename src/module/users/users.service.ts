import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      companyName: user.companyName,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((item) => item.role.code),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}