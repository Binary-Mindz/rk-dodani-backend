import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Stripe as StripeType } from 'stripe';
import {
  BillingInterval,
  UserRoleCode,
  SubscriptionStatus,
  EntitlementSourceType,
  EntitlementType,
  EntitlementStatus,
  BillingProvider,
  PlanAudience,
  Prisma,
  CustomSubscriptionAssignmentStatus,
  AuthProviderType,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { MailService } from 'common/mail/mail.service';
import { AssignCustomSubscriptionDto } from './dto/assign-custom-subscription.dto';
import { ChatService } from '../chat/chat.service';
import { QueryCustomSubscriptionHistoryDto } from './dto/query-custom-subscription-history.dto';

@Injectable()
export class SubscriptionService {
  private stripe!: StripeType;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly chatService: ChatService,
    private readonly mailService: MailService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    const StripeConstructor = require('stripe');
    this.stripe = new StripeConstructor(stripeSecretKey);
  }

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
        entityType: 'SUBSCRIPTION',
        entityId,
        action: action as any,
        oldValues,
        newValues,
      })
      .catch(() => {});
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    seats?: number,
  ): Promise<Record<string, any>> {
    this.logger.log(
      `Initiating sub context processor for userId: ${userId}, planId: ${planId}, seats: ${seats}`,
    );
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const resolvedSeats = this.resolveSeatsForPlan(plan, seats);

    if (Number(plan.priceAmount) === 0) {
      this.logger.log(
        `Triggering instant deployment schema for free plan tier: ${plan.code}`,
      );
      await this.executeInstantFreeActivation(user, plan, resolvedSeats);
      if (plan.targetAudience === PlanAudience.B2B) {
        await this.chatService.ensureTeamConversation(userId, []);
      }
      this.audit(userId, planId, 'CREATE', undefined, {
        planId,
        seats: resolvedSeats,
        isFreeActivation: true,
      });
      return { isFreeActivation: true };
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const unitAmount = Math.round(Number(plan.priceAmount) * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: plan.billingInterval === 'YEARLY' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      ...(plan.trialDays && plan.trialDays > 0
        ? { subscription_data: { trial_period_days: plan.trialDays } }
        : {}),
      customer_email: user.email,
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/plan`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        seats: String(resolvedSeats),
      },
    });

    this.audit(userId, planId, 'CREATE', undefined, {
      planId,
      seats: resolvedSeats,
      checkoutSessionId: session.id,
    });
    return session;
  }

  private async executeInstantFreeActivation(
    user: any,
    plan: any,
    seats: number,
  ): Promise<void> {
    const targetRoleCode =
      plan.targetAudience === PlanAudience.B2C
        ? UserRoleCode.STUDENT
        : UserRoleCode.ENTERPRISE;
    const roleRecord = await this.prisma.role.findUnique({
      where: { code: targetRoleCode },
    });
    if (!roleRecord)
      throw new NotFoundException(`Role ${targetRoleCode} config missing`);

    const fakeSessionId = `free_activation_${plan.code}_${Date.now()}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          provider: BillingProvider.STRIPE,
          providerSubscriptionId: fakeSessionId,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.calculatePeriodEnd('MONTHLY'),
          currency: plan.currency,
          lastPaymentAt: new Date(),
          lastPaymentAmount: new Prisma.Decimal('0.00'),
          seats,
        },
      });

      await tx.entitlement.create({
        data: {
          userId: user.id,
          planId: plan.id,
          sourceType: EntitlementSourceType.SUBSCRIPTION,
          entitlementType: EntitlementType.PLAN_ACCESS,
          status: EntitlementStatus.ACTIVE,
          startsAt: new Date(),
          endsAt: this.calculatePeriodEnd('MONTHLY'),
        },
      });

      // ✅ STRICTLY ONE ACTIVE ROLE RULE: Deactivate old roles
      await tx.userRole.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
        update: {
          isActive: true,
          expiresAt: this.calculatePeriodEnd('MONTHLY'),
        },
        create: {
          userId: user.id,
          roleId: roleRecord.id,
          isActive: true,
          expiresAt: this.calculatePeriodEnd('MONTHLY'),
        },
      });
    });
  }

  private resolveSeatsForPlan(
    plan: { targetAudience: PlanAudience; maxUsers?: number | null },
    seats?: number,
  ): number {
    if (plan.targetAudience !== PlanAudience.B2B) {
      return 1;
    }

    return Math.max(1, seats ?? plan.maxUsers ?? 1);
  }

  async ensureFreePlanForUser(userId: string): Promise<void> {
    this.logger.log(
      `Checking baseline tier configuration for userId: ${userId}`,
    );

    const existingActiveSub = await this.prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
    });

    if (existingActiveSub) {
      this.logger.log(
        `User ${userId} already has an active subscription. Skipping auto-free activation.`,
      );
      return;
    }

    const freePlan = await this.prisma.plan.findFirst({
      where: {
        isActive: true,
        priceAmount: new Prisma.Decimal('0.00'),
      },
    });

    if (!freePlan) {
      this.logger.warn(
        `🚨 System failure: Default Free Plan model is missing in DB seeds.`,
      );
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User identity not found');

    this.logger.log(
      `Auto-routing user ${userId} to baseline free tier: ${freePlan.code}`,
    );

    await this.executeInstantFreeActivation(
      user,
      freePlan,
      this.resolveSeatsForPlan(freePlan),
    );
  }

  async verifySessionAndAssignRole(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const validStatuses = ['paid', 'no_payment_required'];
    if (!validStatuses.includes(session.payment_status)) {
      throw new BadRequestException(
        'Payment validation error from automated gateway',
      );
    }
    await this.handleSuccessfulCheckout(session);
  }

  async handleSuccessfulCheckout(session: Record<string, any>): Promise<void> {
    const sessionId = session.id;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const seats = Number(session.metadata?.seats || 1);

    if (!userId || !planId)
      throw new BadRequestException('Missing session metadata payloads');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!plan || !user)
      throw new NotFoundException('Context mapping execution faulted');

    // ✅ STRICT AUDIENCE ORIENTED ROLE MAPPING
    const targetRoleCode =
      plan.targetAudience === PlanAudience.B2C
        ? UserRoleCode.STUDENT
        : UserRoleCode.ENTERPRISE;

    const roleRecord = await this.prisma.role.findUnique({
      where: { code: targetRoleCode },
    });
    if (!roleRecord)
      throw new NotFoundException(`Role code configuration invalid`);

    const targetSubId = session.subscription
      ? String(session.subscription)
      : sessionId;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: targetSubId },
    });
    if (existingSub) return;

    const isTrialing = session.payment_status === 'no_payment_required';
    const now = new Date();
    const trialDays = plan.trialDays && plan.trialDays > 0 ? plan.trialDays : 14;
    const trialEnd = isTrialing
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      : null;

    try {
      await this.prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            provider: BillingProvider.STRIPE,
            providerSubscriptionId: targetSubId,
            providerCustomerId: session.customer
              ? String(session.customer)
              : null,
            status: isTrialing
              ? SubscriptionStatus.TRIALING
              : SubscriptionStatus.ACTIVE,
            startedAt: now,
            trialStartsAt: isTrialing ? now : null,
            trialEndsAt: trialEnd,
            currentPeriodStart: now,
            currentPeriodEnd: this.calculatePeriodEnd(plan.billingInterval),
            currency: plan.currency,
            lastPaymentAt: isTrialing ? null : now,
            lastPaymentAmount: isTrialing
              ? new Prisma.Decimal('0.00')
              : new Prisma.Decimal(plan.priceAmount),
            seats: seats,
          },
        });

        await tx.customSubscriptionAssignment.updateMany({
          where: { checkoutSessionId: sessionId },
          data: {
            status: CustomSubscriptionAssignmentStatus.PAID,
            paidAt: new Date(),
            subscriptionId: subscription.id,
          },
        });

        await tx.entitlement.create({
          data: {
            userId: user.id,
            planId: plan.id,
            sourceType: EntitlementSourceType.SUBSCRIPTION,
            entitlementType: EntitlementType.PLAN_ACCESS,
            status: EntitlementStatus.ACTIVE,
            startsAt: new Date(),
            endsAt: this.calculatePeriodEnd(plan.billingInterval),
          },
        });

        // ✅ ENSURE EXCLUSIVITY - DEACTIVATE ALL PREVIOUS USER ROLES
        await tx.userRole.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        });

        await tx.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
          update: {
            isActive: true,
            expiresAt: this.calculatePeriodEnd(plan.billingInterval),
          },
          create: {
            userId: user.id,
            roleId: roleRecord.id,
            isActive: true,
            expiresAt: this.calculatePeriodEnd(plan.billingInterval),
          },
        });
      });

      if (plan.targetAudience === PlanAudience.B2B) {
        await this.chatService.ensureTeamConversation(user.id, []);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ DB Transaction failure inside gateway routing:`,
        err.stack,
      );
      throw error;
    }
  }

  private calculatePeriodEnd(interval: string): Date {
    const date = new Date();
    if (interval === 'YEARLY') date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
    return date;
  }

  private formatCustomAssignment(assignment: any) {
    return {
      id: assignment.id,
      userId: assignment.userId,
      user: assignment.user
        ? {
            id: assignment.user.id,
            email: assignment.user.email,
            fullName: assignment.user.fullName,
            avatarUrl: assignment.user.avatarUrl,
          }
        : null,
      assignedBy: assignment.assignedBy,
      assignedByUser: assignment.assignedByUser
        ? {
            id: assignment.assignedByUser.id,
            email: assignment.assignedByUser.email,
            fullName: assignment.assignedByUser.fullName,
            avatarUrl: assignment.assignedByUser.avatarUrl,
          }
        : null,
      planId: assignment.planId,
      plan: assignment.plan
        ? {
            id: assignment.plan.id,
            code: assignment.plan.code,
            name: assignment.plan.name,
            planTitle: assignment.plan.planTitle,
          }
        : null,
      isPo: assignment.isPo ?? false,
      poNumber: assignment.poNumber ?? null,
      checkoutSessionId: assignment.checkoutSessionId,
      checkoutUrl: assignment.checkoutUrl,
      amount: Number(assignment.amount),
      currency: assignment.currency,
      billingInterval: assignment.billingInterval,
      seats: assignment.seats,
      status: assignment.status,
      note: assignment.note,
      paidAt: assignment.paidAt,
      subscriptionId: assignment.subscriptionId,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  async getCustomAssignmentHistory(query: QueryCustomSubscriptionHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomSubscriptionAssignmentWhereInput = {
      ...(query.userId && { userId: query.userId }),
      ...(query.assignedBy && { assignedBy: query.assignedBy }),
      ...(query.status && { status: query.status }),
      ...(query.billingInterval && { billingInterval: query.billingInterval }),
      ...(query.search && {
        OR: [
          {
            checkoutSessionId: { contains: query.search, mode: 'insensitive' },
          },
          { poNumber: { contains: query.search, mode: 'insensitive' } },
          { note: { contains: query.search, mode: 'insensitive' } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
          {
            user: { fullName: { contains: query.search, mode: 'insensitive' } },
          },
          {
            assignedByUser: {
              email: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            assignedByUser: {
              fullName: { contains: query.search, mode: 'insensitive' },
            },
          },
          { plan: { name: { contains: query.search, mode: 'insensitive' } } },
          { plan: { code: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customSubscriptionAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, fullName: true, avatarUrl: true },
          },
          assignedByUser: {
            select: { id: true, email: true, fullName: true, avatarUrl: true },
          },
          plan: {
            select: { id: true, code: true, name: true, planTitle: true },
          },
        },
      }),
      this.prisma.customSubscriptionAssignment.count({ where }),
    ]);

    return {
      items: items.map((assignment) => this.formatCustomAssignment(assignment)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async assignCustomSubscription(
    adminUserId: string,
    dto: AssignCustomSubscriptionDto,
  ) {
    let user = dto.userId
      ? await this.prisma.user.findUnique({
          where: { id: dto.userId },
        })
      : null;

    if (!user && dto.newUser) {
      const normalizedEmail = dto.newUser.email.toLowerCase().trim();
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        user = existingUser;
      } else {
        const rawPassword =
          dto.newUser.password || crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        const fullName =
          [dto.newUser.firstName, dto.newUser.lastName]
            .filter(Boolean)
            .join(' ') ||
          dto.newUser.companyName ||
          'Enterprise User';

        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            firstName: dto.newUser.firstName ?? null,
            lastName: dto.newUser.lastName ?? null,
            fullName,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            signupSource: AuthProviderType.LOCAL,
          },
        });

        // Send credentials email
        await this.mailService.sendEnterpriseAccountCredentials(
          user.email,
          user.fullName || user.email,
          rawPassword,
          dto.planTitle ?? 'Enterprise Custom Plan',
          dto.poNumber,
        );
      }
    }

    if (!user) {
      throw new BadRequestException(
        'Target user not found and no valid new user details provided.',
      );
    }

    const billingInterval = dto.billingInterval ?? BillingInterval.MONTHLY;
    const targetAudience = dto.targetAudience ?? PlanAudience.B2B;
    const seats = dto.seats ?? (targetAudience === PlanAudience.B2B ? 200 : 1);

    // ✅ SARAH ENTERPRISE USE CASE: OFFLINE PROCUREMENT / PURCHASE ORDER (PO)
    if (dto.isPo) {
      if (!dto.poNumber) {
        throw new BadRequestException(
          'Purchase Order (PO) number is required for PO assignment.',
        );
      }

      const customPlan = await this.prisma.plan.create({
        data: {
          code: `PO_${Date.now()}`,
          name: dto.planTitle ?? 'Enterprise Custom Plan',
          planTitle: dto.planTitle ?? 'Enterprise Custom Plan',
          description: `Admin-created Enterprise PO subscription: ${dto.poNumber}`,
          billingProvider: BillingProvider.MANUAL,
          billingInterval,
          currency: dto.currency?.toUpperCase() ?? 'USD',
          priceAmount: new Prisma.Decimal(dto.customPrice ?? 0),
          trialDays: dto.trialDays ?? 0,
          isAutoRenew: dto.autoRenew ?? true,
          isPublic: false,
          isActive: true,
          targetAudience,
          maxUsers: seats,
          metadata: {
            isCustom: true,
            isPo: true,
            poNumber: dto.poNumber,
            assignedUserId: user.id,
            assignedBy: adminUserId,
            note: dto.note ?? null,
            seats,
          },
        },
      });

      const targetRoleCode =
        targetAudience === PlanAudience.B2C
          ? UserRoleCode.STUDENT
          : UserRoleCode.ENTERPRISE;

      const roleRecord = await this.prisma.role.findUnique({
        where: { code: targetRoleCode },
      });
      if (!roleRecord)
        throw new NotFoundException(`Role ${targetRoleCode} config missing`);

      const manualSubId = `PO_${dto.poNumber}_${Date.now()}`;

      const { subscription, assignment } = await this.prisma.$transaction(
        async (tx) => {
          // Deactivate any existing active subscriptions for this user
          await tx.subscription.updateMany({
            where: {
              userId: user.id,
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
              },
            },
            data: {
              status: SubscriptionStatus.CANCELED,
              endedAt: new Date(),
            },
          });

          // Deactivate active entitlements for this user
          await tx.entitlement.updateMany({
            where: {
              userId: user.id,
              status: EntitlementStatus.ACTIVE,
            },
            data: {
              status: EntitlementStatus.REVOKED,
              endsAt: new Date(),
            },
          });

          const isTrialing = Boolean(dto.trialDays && dto.trialDays > 0);
          const now = new Date();
          const trialEnd = isTrialing
            ? new Date(now.getTime() + dto.trialDays! * 24 * 60 * 60 * 1000)
            : null;
          const periodEnd = isTrialing
            ? trialEnd!
            : this.calculatePeriodEnd(billingInterval);

          // Create new PO manual subscription
          const sub = await tx.subscription.create({
            data: {
              userId: user.id,
              planId: customPlan.id,
              provider: BillingProvider.MANUAL,
              providerSubscriptionId: manualSubId,
              status: isTrialing
                ? SubscriptionStatus.TRIALING
                : SubscriptionStatus.ACTIVE,
              startedAt: now,
              trialStartsAt: isTrialing ? now : null,
              trialEndsAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              currency: customPlan.currency,
              lastPaymentAt: isTrialing ? null : now,
              lastPaymentAmount: isTrialing
                ? new Prisma.Decimal('0.00')
                : customPlan.priceAmount,
              seats,
              poNumber: dto.poNumber,
              paymentMethod: 'PO',
            },
          });

          // Create custom subscription assignment marked as PAID
          const assign = await tx.customSubscriptionAssignment.create({
            data: {
              userId: user.id,
              assignedBy: adminUserId,
              planId: customPlan.id,
              isPo: true,
              poNumber: dto.poNumber,
              checkoutSessionId: `PO_SESSION_${sub.id}`,
              checkoutUrl: null,
              amount: customPlan.priceAmount,
              currency: customPlan.currency,
              billingInterval,
              seats,
              status: CustomSubscriptionAssignmentStatus.PAID,
              paidAt: new Date(),
              subscriptionId: sub.id,
              note: dto.note ?? null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
              assignedByUser: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
              plan: {
                select: { id: true, code: true, name: true, planTitle: true },
              },
            },
          });

          // Create entitlement
          await tx.entitlement.create({
            data: {
              userId: user.id,
              planId: customPlan.id,
              sourceType: EntitlementSourceType.SUBSCRIPTION,
              entitlementType:
                dto.entitlementType ?? EntitlementType.PLAN_ACCESS,
              status: EntitlementStatus.ACTIVE,
              startsAt: now,
              endsAt: periodEnd,
            },
          });

          // Deactivate all previous roles
          await tx.userRole.updateMany({
            where: { userId: user.id, isActive: true },
            data: { isActive: false },
          });

          // Activate target role
          await tx.userRole.upsert({
            where: {
              userId_roleId: { userId: user.id, roleId: roleRecord.id },
            },
            update: {
              isActive: true,
              expiresAt: periodEnd,
            },
            create: {
              userId: user.id,
              roleId: roleRecord.id,
              isActive: true,
              expiresAt: periodEnd,
            },
          });

          return { subscription: sub, assignment: assign };
        },
      );

      if (targetAudience === PlanAudience.B2B) {
        await this.chatService.ensureTeamConversation(user.id, []);
      }

      this.audit(adminUserId, assignment.id, 'CREATE', undefined, {
        isCustom: true,
        isPo: true,
        poNumber: dto.poNumber,
        userId: user.id,
        planId: customPlan.id,
        subscriptionId: subscription.id,
        seats,
      });

      return {
        assignment: this.formatCustomAssignment(assignment),
        paymentUrl: null,
        paymentSessionId: null,
        isPo: true,
        poNumber: dto.poNumber,
        userId: user.id,
        message: `Enterprise plan successfully activated with PO #${dto.poNumber}. Account upgraded immediately.`,
      };
    }

    // ✅ MARCUS SMB USE CASE: STRIPE CREDIT CARD PAYMENT LINK
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const customPlan = await this.prisma.plan.create({
      data: {
        code: `CUSTOM_${Date.now()}`,
        name: dto.planTitle ?? 'Custom Plan',
        planTitle: dto.planTitle ?? 'Custom Plan',
        description: 'Admin-created custom subscription',
        billingProvider: BillingProvider.MANUAL,
        billingInterval,
        currency: dto.currency?.toUpperCase() ?? 'USD',
        priceAmount: new Prisma.Decimal(dto.customPrice ?? 0),
        trialDays: dto.trialDays ?? 0,
        isAutoRenew: dto.autoRenew ?? true,
        isPublic: false,
        isActive: true,
        targetAudience,
        metadata: {
          isCustom: true,
          assignedUserId: user.id,
          assignedBy: adminUserId,
          note: dto.note ?? null,
          seats,
        },
      },
    });

    const unitAmount = Math.round(Number(customPlan.priceAmount) * 100);
    const trialDays =
      dto.trialDays !== undefined ? dto.trialDays : (customPlan.trialDays || 0);

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: customPlan.currency.toLowerCase(),
            product_data: {
              name: customPlan.name,
              description: customPlan.description || undefined,
            },
            unit_amount: unitAmount,
            recurring: {
              interval:
                billingInterval === BillingInterval.YEARLY ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email,
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/plan`,
      metadata: {
        userId: user.id,
        planId: customPlan.id,
        seats: String(seats),
        isCustom: 'true',
        note: dto.note ?? '',
        assignedBy: adminUserId,
      },
    };

    if (trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new BadRequestException('Stripe payment link could not be created');
    }

    const assignment = await this.prisma.customSubscriptionAssignment.create({
      data: {
        userId: user.id,
        assignedBy: adminUserId,
        planId: customPlan.id,
        isPo: false,
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
        amount: customPlan.priceAmount,
        currency: customPlan.currency,
        billingInterval,
        seats,
        status: CustomSubscriptionAssignmentStatus.PENDING,
        note: dto.note ?? null,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        assignedByUser: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        plan: { select: { id: true, code: true, name: true, planTitle: true } },
      },
    });

    this.audit(adminUserId, assignment.id, 'CREATE', undefined, {
      isCustom: true,
      userId: user.id,
      paymentPending: true,
      planId: customPlan.id,
      checkoutSessionId: session.id,
    });

    try {
      await this.mailService.sendCustomPlanPaymentLink(
        user.email,
        dto.planTitle ?? customPlan.name,
        session.url,
        dto.customPrice ?? Number(customPlan.priceAmount),
        dto.currency ?? customPlan.currency,
      );
    } catch (mailError) {
      this.logger.warn(
        `Could not send custom plan payment email to ${user.email}: ${mailError}`,
      );
    }

    return {
      assignment: this.formatCustomAssignment(assignment),
      paymentUrl: session.url,
      paymentSessionId: session.id,
      isPo: false,
      message:
        'Payment link created. User can complete payment to activate the subscription.',
    };
  }

  async cancelSubscription(userId: string, subscriptionId?: string) {
    const subscription = subscriptionId
      ? await this.prisma.subscription.findFirst({
          where: { id: subscriptionId, userId },
        })
      : await this.prisma.subscription.findFirst({
          where: {
            userId,
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
        });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          endedAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      await tx.entitlement.updateMany({
        where: { userId, status: EntitlementStatus.ACTIVE },
        data: { status: EntitlementStatus.REVOKED, endsAt: new Date() },
      });

      await tx.userRole.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      return tx.subscription.findUnique({ where: { id: subscription.id } });
    });

    this.audit(userId, updated!.id, 'UPDATE', undefined, {
      canceled: true,
      subscriptionId: subscription.id,
    });

    return updated;
  }

  async assignPlanManually(
    targetUserId: string,
    planId: string,
    seats: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Target user not found');

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Active plan not found');

    if (plan.targetAudience === PlanAudience.B2B) {
      if (!seats || seats < 1) {
        throw new BadRequestException(
          'Seats count must be at least 1 for a B2B plan.',
        );
      }
    } else {
      seats = 1;
    }

    const targetRoleCode =
      plan.targetAudience === PlanAudience.B2C
        ? UserRoleCode.STUDENT
        : UserRoleCode.ENTERPRISE;
    const roleRecord = await this.prisma.role.findUnique({
      where: { code: targetRoleCode },
    });
    if (!roleRecord)
      throw new NotFoundException(`Role ${targetRoleCode} config missing`);

    const manualSubId = `manual_activation_${plan.code}_${Date.now()}`;

    const subscription = await this.prisma.$transaction(async (tx) => {
      // Deactivate any existing active subscriptions for this user
      await tx.subscription.updateMany({
        where: {
          userId: targetUserId,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          endedAt: new Date(),
        },
      });

      // Deactivate active entitlements for this user
      await tx.entitlement.updateMany({
        where: {
          userId: targetUserId,
          status: EntitlementStatus.ACTIVE,
        },
        data: {
          status: EntitlementStatus.REVOKED,
          endsAt: new Date(),
        },
      });

      // Create new manual subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: targetUserId,
          planId: plan.id,
          provider: BillingProvider.MANUAL,
          providerSubscriptionId: manualSubId,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.calculatePeriodEnd(plan.billingInterval),
          currency: plan.currency,
          lastPaymentAt: new Date(),
          lastPaymentAmount: new Prisma.Decimal('0.00'),
          seats: seats,
        },
      });

      // Create entitlement
      await tx.entitlement.create({
        data: {
          userId: targetUserId,
          planId: plan.id,
          sourceType: EntitlementSourceType.SUBSCRIPTION,
          entitlementType: EntitlementType.PLAN_ACCESS,
          status: EntitlementStatus.ACTIVE,
          startsAt: new Date(),
          endsAt: this.calculatePeriodEnd(plan.billingInterval),
        },
      });

      // Deactivate all previous roles
      await tx.userRole.updateMany({
        where: { userId: targetUserId, isActive: true },
        data: { isActive: false },
      });

      // Activate target B2B or B2C role
      await tx.userRole.upsert({
        where: {
          userId_roleId: { userId: targetUserId, roleId: roleRecord.id },
        },
        update: {
          isActive: true,
          expiresAt: this.calculatePeriodEnd(plan.billingInterval),
        },
        create: {
          userId: targetUserId,
          roleId: roleRecord.id,
          isActive: true,
          expiresAt: this.calculatePeriodEnd(plan.billingInterval),
        },
      });

      return subscription;
    });
    if (plan.targetAudience === PlanAudience.B2B) {
      await this.chatService.ensureTeamConversation(targetUserId, []);
    }

    this.audit(targetUserId, subscription.id, 'CREATE', undefined, {
      planId,
      seats,
    });
    return subscription;
  }
}
