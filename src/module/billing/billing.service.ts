import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillingProvider, SubscriptionStatus } from '@prisma/client';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        id: dto.planId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan.billingProvider !== BillingProvider.STRIPE) {
      throw new BadRequestException('This plan is not a Stripe plan');
    }

    if (!plan.stripePriceId) {
      throw new BadRequestException('Stripe price ID is missing for this plan');
    }

    const existingActiveSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        planId: plan.id,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.INCOMPLETE,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });

    if (existingActiveSubscription) {
      throw new BadRequestException(
        'User already has an existing subscription flow for this plan',
      );
    }

    const stripe = this.stripeService.getClient();

    const session = await stripe.checkout.sessions.create({
      mode: plan.billingInterval === 'ONE_TIME' ? 'payment' : 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url:
        dto.successUrl ??
        process.env.STRIPE_SUCCESS_URL ??
        'http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:
        dto.cancelUrl ??
        process.env.STRIPE_CANCEL_URL ??
        'http://localhost:3000/billing/cancel',
      metadata: {
        userId,
        planId: plan.id,
        planCode: plan.code,
        note: dto.note ?? '',
      },
      subscription_data:
        plan.billingInterval === 'ONE_TIME'
          ? undefined
          : {
              metadata: {
                userId,
                planId: plan.id,
                planCode: plan.code,
              },
              trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
            },
    });

    return {
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        billingInterval: plan.billingInterval,
        currency: plan.currency,
        priceAmount: plan.priceAmount,
      },
    };
  }

  async getMySubscription(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
      },
      include: {
        plan: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return subscriptions;
  }

  async cancelMySubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException(
        'Provider subscription id missing for this subscription',
      );
    }

    const stripe = this.stripeService.getClient();

    const canceled = await stripe.subscriptions.update(
      subscription.providerSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: canceled.cancel_at_period_end,
      },
    });

    return {
      id: subscription.id,
      providerSubscriptionId: subscription.providerSubscriptionId,
      cancelAtPeriodEnd: canceled.cancel_at_period_end,
      status: 'CANCEL_SCHEDULED',
    };
  }
}