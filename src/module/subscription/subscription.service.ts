import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Stripe as StripeType } from 'stripe';
import { UserRoleCode, SubscriptionStatus, EntitlementSourceType, EntitlementType, EntitlementStatus, BillingProvider } from '@prisma/client';

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

  async createCheckoutSession(userId: string, planId: string): Promise<Record<string, any>> {
    this.logger.log(`Initiating checkout session generation for userId: ${userId}, planId: ${planId}`);
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, isActive: true, isPublic: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const unitAmount = Math.round(Number(plan.priceAmount) * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: { name: plan.name, description: plan.description || undefined },
          unit_amount: unitAmount,
          ...(plan.billingInterval !== 'ONE_TIME' && {
            recurring: { interval: plan.billingInterval === 'YEARLY' ? 'year' : 'month' },
          }),
        },
        quantity: 1, 
      }],
      mode: plan.billingInterval === 'ONE_TIME' ? 'payment' : 'subscription',
      customer_email: user.email,
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: { userId: user.id, planId: plan.id },
    });
     
    this.logger.log(`Checkout session successfully created: ${session.id} for User: ${userId}`);
    return session;
  }


  async verifySessionAndAssignRole(sessionId: string): Promise<void> {
    this.logger.log(`Verifying Stripe Session manually: ${sessionId}`);

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Verification failed: Session ${sessionId} is not paid yet.`);
      throw new BadRequestException('Payment has not been completed for this session.');
    }

    await this.handleSuccessfulCheckout(session);
  }


  async handleSuccessfulCheckout(session: Record<string, any>): Promise<void> {
    const sessionId = session.id;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      this.logger.error(`Processing halted: Missing metadata in Stripe session ${sessionId}`);
      throw new BadRequestException('Missing userId or planId in session metadata');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!plan || !user) {
      throw new NotFoundException('Plan or User context not found');
    }

    let targetRoleCode: UserRoleCode;
    if (plan.code.startsWith('STUDENT_')) {
      targetRoleCode = UserRoleCode.STUDENT;
    } else if (plan.code.startsWith('SOLO_PROF_')) {
      targetRoleCode = UserRoleCode.SOLO_PROF;
    } else if (plan.code.startsWith('SMB_')) {
      targetRoleCode = UserRoleCode.SMB;
    } else if (plan.code.startsWith('ENTERPRISE_')) {
      targetRoleCode = UserRoleCode.ENTERPRISE;
    } else {
      throw new BadRequestException(`Unknown mapping infrastructure for plan code: ${plan.code}`);
    }

    const roleRecord = await this.prisma.role.findUnique({ where: { code: targetRoleCode } });
    if (!roleRecord) throw new NotFoundException(`Role "${targetRoleCode}" not found.`);

    const existingSub = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: session.subscription ? String(session.subscription) : sessionId }
    });
    if (existingSub) {
      this.logger.warn(`Session ${sessionId} already processed into database. Skipping to prevent duplicates.`);
      return;
    }

    this.logger.log(`Running DB Transaction -> User: ${user.email}, Role Upgrading to: ${targetRoleCode}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            provider: BillingProvider.STRIPE,
            providerSubscriptionId: session.subscription ? String(session.subscription) : sessionId,
            providerCustomerId: session.customer ? String(session.customer) : null,
            status: SubscriptionStatus.ACTIVE,
            startedAt: new Date(),
            currentPeriodStart: new Date(),
            currentPeriodEnd: calculatePeriodEnd(plan.billingInterval),
            currency: plan.currency,
            lastPaymentAt: new Date(),
            lastPaymentAmount: plan.priceAmount,
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
            endsAt: calculatePeriodEnd(plan.billingInterval),
          },
        });

        await tx.userRole.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        });

      
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
          update: { isActive: true, expiresAt: calculatePeriodEnd(plan.billingInterval) },
          create: { userId: user.id, roleId: roleRecord.id, isActive: true, expiresAt: calculatePeriodEnd(plan.billingInterval) },
        });
      });

      this.logger.log(`🎉 [SUCCESS] User ${user.email} role updated to "${targetRoleCode}" successfully!`);
    } catch (error) {
      this.logger.error(`❌ DB Transaction failed for session ${sessionId}:`, error.stack);
      throw error;
    }
  }
}

function calculatePeriodEnd(interval: string): Date {
  const date = new Date();
  if (interval === 'YEARLY') date.setFullYear(date.getFullYear() + 1);
  else if (interval === 'MONTHLY') date.setMonth(date.getMonth() + 1);
  else date.setDate(date.getDate() + 30); 
  return date;
}