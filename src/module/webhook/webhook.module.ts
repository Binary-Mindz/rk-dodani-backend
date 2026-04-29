import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { WebhookController } from './webhook.controllrer';

@Module({
  imports: [BillingModule],
  controllers: [WebhookController],
})
export class WebhookModule {}