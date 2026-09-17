import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  PlanAudience,
  SubscriptionStatus,
  TeamRole,
  UserRoleCode,
} from '@prisma/client';
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
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
            createdAt: 'desc',
          },
          take: 1,
          include: {
            plan: true,
          },
        },
        parentUser: {
          include: {
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
                createdAt: 'desc',
              },
              take: 1,
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
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
        parentUser: {
          include: {
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
    const directSubscription = user.subscriptions?.[0] || null;
    const parentSubscription = user.parentUser?.subscriptions?.[0] || null;

    const isEnterpriseOwner =
      !user.parentUserId &&
      (user.roles?.some(
        (r: any) =>
          (r.role?.code || r.code || r) === UserRoleCode.ENTERPRISE,
      ) ||
        directSubscription?.plan?.targetAudience === PlanAudience.B2B);

    const isTeamMember = !!user.parentUserId;

    // For team members, if parent has active B2B subscription, inherit enterprise purchase coverage
    const effectiveSubscription = directSubscription || parentSubscription;
    const effectivePlan = effectiveSubscription?.plan || null;

    const roles: UserRoleCode[] = (user.roles || []).map(
      (item: any) => item.role?.code || item.code || item,
    );

    if (
      isTeamMember &&
      parentSubscription?.plan?.targetAudience === PlanAudience.B2B &&
      !roles.includes(UserRoleCode.ENTERPRISE)
    ) {
      roles.push(UserRoleCode.ENTERPRISE);
    }

    const teamRole = isTeamMember
      ? user.teamRole || TeamRole.MEMBER
      : isEnterpriseOwner
        ? TeamRole.OWNER
        : null;

    const enterpriseAccount = user.parentUser
      ? {
          ownerId: user.parentUser.id,
          ownerName:
            user.parentUser.fullName ||
            [user.parentUser.firstName, user.parentUser.lastName]
              .filter(Boolean)
              .join(' ') ||
            user.parentUser.email,
          ownerEmail: user.parentUser.email,
          planName: parentSubscription?.plan?.name || null,
          planTitle: parentSubscription?.plan?.title || null,
          subscriptionStatus: parentSubscription?.status || null,
          seatsAllocated: parentSubscription?.seats || 0,
        }
      : isEnterpriseOwner && directSubscription
        ? {
            ownerId: user.id,
            ownerName: user.fullName || user.email,
            ownerEmail: user.email,
            planName: directSubscription.plan?.name || null,
            planTitle: directSubscription.plan?.title || null,
            subscriptionStatus: directSubscription.status,
            seatsAllocated: directSubscription.seats,
          }
        : null;

    const teamContext = {
      isTeamMember,
      isTeamOwner: isEnterpriseOwner,
      teamRole,
      enterpriseAccount,
    };

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
      roles,
      onATeam: isTeamMember,
      teamRole,
      teamContext,
      purchaseInfo: effectiveSubscription
        ? {
            subscriptionId: effectiveSubscription.id,
            status: effectiveSubscription.status,
            currentPeriodStart: effectiveSubscription.currentPeriodStart,
            currentPeriodEnd: effectiveSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: effectiveSubscription.cancelAtPeriodEnd,
            provider: effectiveSubscription.provider,
            isEnterpriseCovered: !directSubscription && !!parentSubscription,
            plan: {
              id: effectivePlan?.id || null,
              code: effectivePlan?.code || null,
              name: effectivePlan?.name || null,
              targetAudience: effectivePlan?.targetAudience || null,
              billingInterval: effectivePlan?.billingInterval || null,
              currency: effectivePlan?.currency || null,
              priceAmount: effectivePlan?.priceAmount
                ? Number(effectivePlan.priceAmount)
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
