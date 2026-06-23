import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { QueryUserManagementDto } from './dto/query-user-management.dto';
import { UpdateUserManagementDto } from './dto/update-user-management.dto';
import { AuditAction, Prisma, SubscriptionStatus, UserRoleCode, UserStatus } from '@prisma/client';

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
            role: { code: UserRoleCode.SUPER_ADMIN },
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
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }


  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        timezone: true,
        roles: {
          where: { isActive: true },
          include: { role: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile records not located.');
    }

    const activeSub = user.subscriptions.find(s => s.status === SubscriptionStatus.ACTIVE) || null;

    return {
      userId: user.id,
      name: user.fullName || 'Unknown User',
      email: user.email,
      phone: user.phone || 'N/A',
      status: user.status,
      joinedDate: user.createdAt,
      lastLogin: user.lastLoginAt,
      personaType: user.roles.map((r) => r.role.code).join(', ') || 'No Role',
      region: user.timezone || 'Global Tier',
      subscription: activeSub ? {
        planName: activeSub.plan.name,
        billingInterval: activeSub.plan.billingInterval,
        nextRenewal: activeSub.currentPeriodEnd,
        features: activeSub.plan.features,
      } : null,
      recentActivity: user.auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress
      }))
    };
  }


 async update(id: string, dto: UpdateUserManagementDto, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User profile target missing.');
    }

    return await this.prisma.$transaction(async (tx) => {
      if (dto.planId) {
        const plan = await tx.plan.findUnique({ where: { id: dto.planId } });
        if (!plan) throw new BadRequestException('Requested backend subscription plan not found.');

        await tx.subscription.updateMany({
          where: { userId: id, status: SubscriptionStatus.ACTIVE },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        const billingCycle = dto.billingInterval || plan.billingInterval;
        const periodEnd = new Date();
        if (billingCycle === 'YEARLY') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await tx.subscription.create({
          data: {
            userId: id,
            planId: dto.planId,
            status: SubscriptionStatus.ACTIVE,
            provider: plan.billingProvider || 'ADMIN',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            metadata: dto.changeReason ? { reason: dto.changeReason } : undefined,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: adminId,
            entityType: 'SUBSCRIPTION',
            entityId: id,
            action: AuditAction.UPDATE,
            newValues: { planId: dto.planId, billingInterval: billingCycle, reason: dto.changeReason },
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

  async suspendUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User profile target missing.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: { status: UserStatus.BLOCKED },
      });

      await tx.subscription.updateMany({
        where: { userId: id, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.CANCELED },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          entityType: 'USER_ACCOUNT',
          entityId: id,
          action: AuditAction.UPDATE,
          newValues: { status: UserStatus.BLOCKED, description: 'Account suspended by SuperAdmin action.' },
        },
      });

      await tx.emailLog.create({
        data: {
          templateCode: 'ACCOUNT_SUSPENDED_NOTICE',
          recipientEmail: user.email,
          recipientUserId: user.id,
          subject: '⚠️ Important Notice: Your account access has been suspended',
          status: 'QUEUED',
        },
      });

      return updatedUser;
    });
  }
}