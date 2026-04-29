import { Injectable, Logger } from '@nestjs/common';
import {
  BillingProvider,
  EntitlementSourceType,
  EntitlementStatus,
  EntitlementType,
  Prisma,
  SubscriptionStatus,
  WebhookProcessingStatus,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import Stripe from 'stripe';

type StripeEvent = any;
type StripeCheckoutSession = any;
type StripeSubscription = any;
type StripeInvoice = any;

@Injectable()
export class SubscriptionSyncService {
  private readonly logger = new Logger(SubscriptionSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapStripeStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'incomplete_expired':
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private toDate(unix?: number | null): Date | null {
    return unix ? new Date(unix * 1000) : null;
  }

  private async upsertWebhookLog(
    provider: BillingProvider,
    event: StripeEvent,
    processingStatus: WebhookProcessingStatus,
    errorMessage?: string | null,
  ) {
    return this.prisma.webhookLog.create({
      data: {
        provider: provider as any,
        eventId: event.id,
        eventType: event.type,
        requestBody: event as unknown as Prisma.InputJsonValue,
        processingStatus,
        errorMessage: errorMessage ?? null,
        processedAt:
          processingStatus === WebhookProcessingStatus.PROCESSED
            ? new Date()
            : null,
      },
    });
  }

  private async createSubscriptionEventLog(
    event: StripeEvent,
    subscriptionId?: string | null,
    userId?: string | null,
  ) {
    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscriptionId ?? null,
        userId: userId ?? null,
        provider: BillingProvider.STRIPE,
        providerEventId: event.id,
        eventType: event.type,
        eventPayload: event as unknown as Prisma.InputJsonValue,
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  private async syncEntitlements(params: {
    userId: string;
    planId: string;
    contentItemId?: string | null;
    subscriptionStatus: SubscriptionStatus;
    providerSubscriptionId: string;
  }) {
    const activeStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIALING,
    ];

    const shouldActivate = activeStatuses.includes(params.subscriptionStatus);

    const existing = await this.prisma.entitlement.findFirst({
      where: {
        userId: params.userId,
        planId: params.planId,
        sourceType: EntitlementSourceType.SUBSCRIPTION,
        sourceId: params.providerSubscriptionId,
      },
    });

    if (!existing) {
      await this.prisma.entitlement.create({
        data: {
          userId: params.userId,
          sourceType: EntitlementSourceType.SUBSCRIPTION,
          sourceId: params.providerSubscriptionId,
          entitlementType: EntitlementType.PLAN_ACCESS,
          planId: params.planId,
          contentItemId: params.contentItemId ?? null,
          status: shouldActivate
            ? EntitlementStatus.ACTIVE
            : EntitlementStatus.PENDING,
          startsAt: shouldActivate ? new Date() : null,
          reason: 'Stripe subscription entitlement sync',
          metadata: {
            provider: 'stripe',
          } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.entitlement.create({
        data: {
          userId: params.userId,
          sourceType: EntitlementSourceType.SUBSCRIPTION,
          sourceId: `${params.providerSubscriptionId}:premium`,
          entitlementType: EntitlementType.PREMIUM_ACCESS,
          planId: params.planId,
          status: shouldActivate
            ? EntitlementStatus.ACTIVE
            : EntitlementStatus.PENDING,
          startsAt: shouldActivate ? new Date() : null,
          reason: 'Stripe premium entitlement sync',
          metadata: {
            provider: 'stripe',
          } as Prisma.InputJsonValue,
        },
      });

      return;
    }

    await this.prisma.entitlement.updateMany({
      where: {
        userId: params.userId,
        OR: [
          {
            sourceType: EntitlementSourceType.SUBSCRIPTION,
            sourceId: params.providerSubscriptionId,
          },
          {
            sourceType: EntitlementSourceType.SUBSCRIPTION,
            sourceId: `${params.providerSubscriptionId}:premium`,
          },
        ],
      },
      data: {
        status: shouldActivate
          ? EntitlementStatus.ACTIVE
          : EntitlementStatus.REVOKED,
        revokedAt: shouldActivate ? null : new Date(),
        startsAt: shouldActivate
          ? existing.startsAt ?? new Date()
          : existing.startsAt,
      },
    });
  }

  async processCheckoutSessionCompleted(event: StripeEvent) {
    const session = event.data.object as StripeCheckoutSession;

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const providerCustomerId =
      typeof session.customer === 'string' ? session.customer : null;
    const providerSubscriptionId =
      typeof session.subscription === 'string' ? session.subscription : null;

    if (!userId || !planId || !providerSubscriptionId) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Missing metadata userId/planId/providerSubscriptionId',
      );
      return;
    }

    const stripeSubscription = await this.prisma.subscription.findFirst({
      where: {
        providerSubscriptionId,
      },
    });

    if (!stripeSubscription) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      const created = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          provider: BillingProvider.STRIPE,
          providerSubscriptionId,
          providerCustomerId,
          providerPriceId: plan?.stripePriceId ?? null,
          status: SubscriptionStatus.INCOMPLETE,
          billingEmail: session.customer_details?.email ?? null,
          metadata: session as unknown as Prisma.InputJsonValue,
        },
      });

      await this.createSubscriptionEventLog(event, created.id, userId);
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.PROCESSED,
      );
      return;
    }

    await this.createSubscriptionEventLog(
      event,
      stripeSubscription.id,
      stripeSubscription.userId,
    );

    await this.upsertWebhookLog(
      BillingProvider.STRIPE,
      event,
      WebhookProcessingStatus.PROCESSED,
    );
  }

  async processCustomerSubscriptionEvent(event: StripeEvent) {
    const subscription = event.data.object as StripeSubscription;
    const providerSubscriptionId = subscription.id;

    const existing = await this.prisma.subscription.findFirst({
      where: {
        providerSubscriptionId,
      },
    });

    if (!existing) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Subscription row not found for providerSubscriptionId',
      );
      return;
    }

    const mappedStatus = this.mapStripeStatus(subscription.status);

    const updated = await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: mappedStatus,
        startedAt: this.toDate(subscription.start_date),
        trialStartsAt: this.toDate(subscription.trial_start),
        trialEndsAt: this.toDate(subscription.trial_end),
        currentPeriodStart: this.toDate(
          subscription.items?.data?.[0]?.current_period_start,
        ),
        currentPeriodEnd: this.toDate(
          subscription.items?.data?.[0]?.current_period_end,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: this.toDate(subscription.canceled_at),
        endedAt: this.toDate(subscription.ended_at),
        providerCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : existing.providerCustomerId,
        metadata: subscription as unknown as Prisma.InputJsonValue,
      },
    });

    await this.syncEntitlements({
      userId: updated.userId,
      planId: updated.planId,
      subscriptionStatus: updated.status,
      providerSubscriptionId:
        updated.providerSubscriptionId ?? providerSubscriptionId,
    });

    await this.createSubscriptionEventLog(event, updated.id, updated.userId);

    await this.upsertWebhookLog(
      BillingProvider.STRIPE,
      event,
      WebhookProcessingStatus.PROCESSED,
    );
  }

  async processInvoicePaid(event: StripeEvent) {
    const invoice = event.data.object as StripeInvoice;
    const providerSubscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : null;

    if (!providerSubscriptionId) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Invoice missing subscription id',
      );
      return;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: {
        providerSubscriptionId,
      },
    });

    if (!existing) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Subscription row not found for invoice.paid',
      );
      return;
    }

    const updated = await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        lastPaymentAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        lastPaymentAmount:
          typeof invoice.amount_paid === 'number'
            ? new Prisma.Decimal(invoice.amount_paid / 100)
            : existing.lastPaymentAmount,
        currency: invoice.currency?.toUpperCase() ?? existing.currency,
        metadata: invoice as unknown as Prisma.InputJsonValue,
      },
    });

    await this.syncEntitlements({
      userId: updated.userId,
      planId: updated.planId,
      subscriptionStatus: updated.status,
      providerSubscriptionId,
    });

    await this.createSubscriptionEventLog(event, updated.id, updated.userId);

    await this.upsertWebhookLog(
      BillingProvider.STRIPE,
      event,
      WebhookProcessingStatus.PROCESSED,
    );
  }

  async processInvoicePaymentFailed(event: StripeEvent) {
    const invoice = event.data.object as StripeInvoice;
    const providerSubscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : null;

    if (!providerSubscriptionId) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Invoice missing subscription id',
      );
      return;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: {
        providerSubscriptionId,
      },
    });

    if (!existing) {
      await this.upsertWebhookLog(
        BillingProvider.STRIPE,
        event,
        WebhookProcessingStatus.FAILED,
        'Subscription row not found for invoice.payment_failed',
      );
      return;
    }

    const updated = await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        failureReason: 'Stripe invoice payment failed',
        metadata: invoice as unknown as Prisma.InputJsonValue,
      },
    });

    await this.syncEntitlements({
      userId: updated.userId,
      planId: updated.planId,
      subscriptionStatus: updated.status,
      providerSubscriptionId,
    });

    await this.createSubscriptionEventLog(event, updated.id, updated.userId);

    await this.upsertWebhookLog(
      BillingProvider.STRIPE,
      event,
      WebhookProcessingStatus.PROCESSED,
    );
  }

  async processEvent(event: StripeEvent) {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.processCheckoutSessionCompleted(event);

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.processCustomerSubscriptionEvent(event);

      case 'invoice.paid':
        return this.processInvoicePaid(event);

      case 'invoice.payment_failed':
        return this.processInvoicePaymentFailed(event);

      default:
        await this.upsertWebhookLog(
          BillingProvider.STRIPE,
          event,
          WebhookProcessingStatus.RECEIVED,
        );
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
        return;
    }
  }
}