import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from '../billing/stripe.service';
import { SubscriptionSyncService } from '../billing/subscription-sync.service';

@ApiExcludeController()
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionSyncService: SubscriptionSyncService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const stripe = this.stripeService.getClient();

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    await this.subscriptionSyncService.processEvent(event);

    return {
      received: true,
    };
  }
}