import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { QueryUserManagementDto } from './dto/query-user-management.dto';
import { UpdateUserManagementDto } from './dto/update-user-management.dto';
import { Prisma, SubscriptionStatus, UserRoleCode, UserStatus } from '@prisma/client';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

 async findAll(query: QueryUserManagementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      NOT: {
        roles: {
          some: {
            role: {
              code: UserRoleCode.SUPER_ADMIN,
            },
            isActive: true,
          },
        },
      },
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.planId && {
        subscriptions: {
          some: {
            planId: query.planId,
            status: SubscriptionStatus.ACTIVE,
          },
        },
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          createdAt: true,
          roles: {
            where: { isActive: true },
            include: { role: true },
          },
          subscriptions: {
            where: {
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    
    const items = users.map((user) => {
      const activeSub = user.subscriptions[0] || null;
      return {
        userId: user.id,
        name: user.fullName || 'Unknown User',
        email: user.email,
        personaType: user.roles.map((r) => r.role.code).join(', ') || 'No Role',
        subscriptionPlan: activeSub?.plan?.name || 'Free Tier',
        status: user.status,
        createdAt: user.createdAt,
      };
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        subscriptions: { include: { plan: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User execution failed. Target user not found.');
    }

    return user;
  }


  async update(id: string, dto: UpdateUserManagementDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User account records not discovered.');
    }

    return await this.prisma.$transaction(async (tx) => {
      if (dto.planId) {
        const plan = await tx.plan.findUnique({ where: { id: dto.planId } });
        if (!plan) throw new BadRequestException('Target subscription plan model not found.');

        
        await tx.subscription.updateMany({
          where: { userId: id, status: SubscriptionStatus.ACTIVE },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        
        await tx.subscription.create({
          data: {
            userId: id,
            planId: dto.planId,
            status: SubscriptionStatus.ACTIVE,
            provider: plan.billingProvider || 'ADMIN',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)), // default 1 month extension
          },
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          ...(dto.status && { status: dto.status }),
        },
      });
    });
  }
}