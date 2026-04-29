import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { SubscriptionSyncService } from './subscription-sync.service';
import { WebhookController } from 'module/webhook/webhook.controllrer';

@Module({
  controllers: [BillingController, WebhookController],
  providers: [BillingService, StripeService, SubscriptionSyncService],
  exports: [BillingService, StripeService, SubscriptionSyncService],
})
export class BillingModule {}