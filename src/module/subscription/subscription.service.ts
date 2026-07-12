import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Stripe as StripeType } from 'stripe';
import { UserRoleCode, SubscriptionStatus, EntitlementSourceType, EntitlementType, EntitlementStatus, BillingProvider, PlanAudience, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private stripe: StripeType;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    const StripeConstructor = require('stripe');
    this.stripe = new StripeConstructor(stripeSecretKey);
  }

  async createCheckoutSession(userId: string, planId: string, seats?: number): Promise<Record<string, any>> {
    this.logger.log(`Initiating sub context processor for userId: ${userId}, planId: ${planId}, seats: ${seats}`);
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (Number(plan.priceAmount) === 0) {
      this.logger.log(`Triggering instant deployment schema for free plan tier: ${plan.code}`);
      await this.executeInstantFreeActivation(user, plan);
      return { isFreeActivation: true };
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const unitAmount = Math.round(Number(plan.priceAmount) * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: { name: plan.name, description: plan.description || undefined },
          unit_amount: unitAmount,
          recurring: { interval: plan.billingInterval === 'YEARLY' ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: plan.trialDays > 0 ? plan.trialDays : 14,
      },
      customer_email: user.email,
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: { 
        userId: user.id, 
        planId: plan.id, 
        seats: '1' 
      },
    });

    return session;
  }

  private async executeInstantFreeActivation(user: any, plan: any): Promise<void> {
    const targetRoleCode = plan.targetAudience === PlanAudience.B2C ? UserRoleCode.STUDENT : UserRoleCode.ENTERPRISE;
    const roleRecord = await this.prisma.role.findUnique({ where: { code: targetRoleCode } });
    if (!roleRecord) throw new NotFoundException(`Role ${targetRoleCode} config missing`);

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
          seats: 1,
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
        update: { isActive: true, expiresAt: this.calculatePeriodEnd('MONTHLY') },
        create: { userId: user.id, roleId: roleRecord.id, isActive: true, expiresAt: this.calculatePeriodEnd('MONTHLY') },
      });
    });
  }

  async ensureFreePlanForUser(userId: string): Promise<void> {
    this.logger.log(`Checking baseline tier configuration for userId: ${userId}`);

    const existingActiveSub = await this.prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]
        }
      }
    });

    if (existingActiveSub) {
      this.logger.log(`User ${userId} already has an active subscription. Skipping auto-free activation.`);
      return;
    }

    const freePlan = await this.prisma.plan.findFirst({
      where: {
        isActive: true,
        priceAmount: new Prisma.Decimal('0.00')
      }
    });

    if (!freePlan) {
      this.logger.warn(`🚨 System failure: Default Free Plan model is missing in DB seeds.`);
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User identity not found');

    this.logger.log(`Auto-routing user ${userId} to baseline free tier: ${freePlan.code}`);

    await this.executeInstantFreeActivation(user, freePlan);
  }

  async verifySessionAndAssignRole(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment validation error from automated gateway');
    }
    await this.handleSuccessfulCheckout(session);
  }

  async handleSuccessfulCheckout(session: Record<string, any>): Promise<void> {
    const sessionId = session.id;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const seats = Number(session.metadata?.seats || 1);

    if (!userId || !planId) throw new BadRequestException('Missing session metadata payloads');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!plan || !user) throw new NotFoundException('Context mapping execution faulted');

    // ✅ STRICT AUDIENCE ORIENTED ROLE MAPPING
    const targetRoleCode = plan.targetAudience === PlanAudience.B2C ? UserRoleCode.STUDENT : UserRoleCode.ENTERPRISE;

    const roleRecord = await this.prisma.role.findUnique({ where: { code: targetRoleCode } });
    if (!roleRecord) throw new NotFoundException(`Role code configuration invalid`);

    const targetSubId = session.subscription ? String(session.subscription) : sessionId;
    const existingSub = await this.prisma.subscription.findFirst({ where: { providerSubscriptionId: targetSubId } });
    if (existingSub) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            provider: BillingProvider.STRIPE,
            providerSubscriptionId: targetSubId,
            providerCustomerId: session.customer ? String(session.customer) : null,
            status: SubscriptionStatus.ACTIVE,
            startedAt: new Date(),
            currentPeriodStart: new Date(),
            currentPeriodEnd: this.calculatePeriodEnd(plan.billingInterval),
            currency: plan.currency,
            lastPaymentAt: new Date(),
            lastPaymentAmount: new Prisma.Decimal(plan.priceAmount),
            seats: seats,
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
          update: { isActive: true, expiresAt: this.calculatePeriodEnd(plan.billingInterval) },
          create: { userId: user.id, roleId: roleRecord.id, isActive: true, expiresAt: this.calculatePeriodEnd(plan.billingInterval) },
        });
      });
    } catch (error) {
      this.logger.error(`❌ DB Transaction failure inside gateway routing:`, error.stack);
      throw error;
    }
  }

  private calculatePeriodEnd(interval: string): Date {
    const date = new Date();
    if (interval === 'YEARLY') date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
    return date;
  }

  async assignPlanManually(targetUserId: string, planId: string, seats: number) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Target user not found');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Active plan not found');

    if (plan.targetAudience === PlanAudience.B2B) {
      if (!seats || seats < 1) {
        throw new BadRequestException('Seats count must be at least 1 for a B2B plan.');
      }
    } else {
      seats = 1;
    }

    const targetRoleCode = plan.targetAudience === PlanAudience.B2C ? UserRoleCode.STUDENT : UserRoleCode.ENTERPRISE;
    const roleRecord = await this.prisma.role.findUnique({ where: { code: targetRoleCode } });
    if (!roleRecord) throw new NotFoundException(`Role ${targetRoleCode} config missing`);

    const manualSubId = `manual_activation_${plan.code}_${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      // Deactivate any existing active subscriptions for this user
      await tx.subscription.updateMany({
        where: {
          userId: targetUserId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
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
        where: { userId_roleId: { userId: targetUserId, roleId: roleRecord.id } },
        update: { isActive: true, expiresAt: this.calculatePeriodEnd(plan.billingInterval) },
        create: { userId: targetUserId, roleId: roleRecord.id, isActive: true, expiresAt: this.calculatePeriodEnd(plan.billingInterval) },
      });

      return subscription;
    });
  }
}