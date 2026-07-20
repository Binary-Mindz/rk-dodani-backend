import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    actorUserId: string | null,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
  ) {
    this.auditService
      .logCustom({
        actorUserId,
        entityType: 'USER',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  async getProfile(userId: string) {
    // ⚡ ১. একই কুয়েরিতে রোল, সাবস্ক্রিপশন এবং প্ল্যানের ডেটা ইনক্লুড করা হয়েছে
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
        // ইউজারটির লেটেস্ট অ্যাক্টিভ অথবা ট্রায়াল সাবস্ক্রিপশনটি বের করার জন্য
        subscriptions: {
          where: {
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
              ],
            },
          },
          orderBy: {
            createdAt: 'desc', // কোনো কারণে একাধিক থাকলে লেটেস্টটি আগে আসবে
          },
          take: 1,
          include: {
            plan: true, // প্ল্যানের নাম, কোড, প্রোভাইডার, ইন্টারভাল জানার জন্য
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ⚡ ২. অ্যাক্টিভ সাবস্ক্রিপশন এবং প্ল্যান অবজেক্ট এক্সট্র্যাক্ট করা
    const activeSubscription = user.subscriptions[0] || null;
    const activePlan = activeSubscription?.plan || null;

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((item) => item.role.code),

      purchaseInfo: activeSubscription
        ? {
            subscriptionId: activeSubscription.id,
            status: activeSubscription.status,
            currentPeriodStart: activeSubscription.currentPeriodStart,
            currentPeriodEnd: activeSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            provider: activeSubscription.provider, // e.g., STRIPE, PATREON
            plan: {
              id: activePlan?.id || null,
              code: activePlan?.code || null, // e.g., 'STUDENT_PRO', 'ENTERPRISE_TEAM'
              name: activePlan?.name || null, // e.g., 'Pro Student Plan'
              targetAudience: activePlan?.targetAudience || null, // B2C or B2B
              billingInterval: activePlan?.billingInterval || null,
              currency: activePlan?.currency || null,
              priceAmount: activePlan?.priceAmount
                ? Number(activePlan.priceAmount)
                : 0,
            },
          }
        : null,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    let fullName: string | undefined | null = undefined;

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const first =
        dto.firstName !== undefined ? dto.firstName : currentUser.firstName;
      const last =
        dto.lastName !== undefined ? dto.lastName : currentUser.lastName;

      fullName = `${first || ''} ${last || ''}`.trim() || null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName: fullName,
        avatarUrl: dto.avatarUrl,
      },
      include: {
        roles: { where: { isActive: true }, include: { role: true } },
        subscriptions: {
          where: {
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    this.audit(
      userId,
      userId,
      'UPDATE',
      {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatarUrl: currentUser.avatarUrl,
      },
      {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
      },
    );
    return this.formatUserResponse(updatedUser);
  }

  private formatUserResponse(user: any) {
    const activeSubscription = user.subscriptions[0] || null;
    const activePlan = activeSubscription?.plan || null;

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((item) => item.role.code),
      purchaseInfo: activeSubscription
        ? {
            subscriptionId: activeSubscription.id,
            status: activeSubscription.status,
            currentPeriodStart: activeSubscription.currentPeriodStart,
            currentPeriodEnd: activeSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            provider: activeSubscription.provider,
            plan: {
              id: activePlan?.id || null,
              code: activePlan?.code || null,
              name: activePlan?.name || null,
              targetAudience: activePlan?.targetAudience || null,
              billingInterval: activePlan?.billingInterval || null,
              currency: activePlan?.currency || null,
              priceAmount: activePlan?.priceAmount
                ? Number(activePlan.priceAmount)
                : 0,
            },
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Local password account not configured for this user',
      );
    }

    const isPasswordMatch = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Incorrect old password');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    this.audit(userId, userId, 'UPDATE', undefined, {
      action: 'password_change',
    });
    return true;
  }
}
