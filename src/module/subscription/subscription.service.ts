import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Stripe as StripeType } from 'stripe'; // Import purely as a type definition

@Injectable()
export class SubscriptionService {
  private stripe: StripeType; // Use the isolated type definition here

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in the environment configuration');
    }


    const StripeConstructor = require('stripe');
    this.stripe = new StripeConstructor(stripeSecretKey);
  }

 async createCheckoutSession(
    userId: string, 
    planId: string
  ): Promise<Record<string, any>> {
    const plan = await this.prisma.plan.findFirst({
      where: {
        id: planId,
        isActive: true,
        isPublic: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('The requested plan was not found or is inactive');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Decimal প্রাইসকে সেন্টস (Cents)-এ কনভার্ট করা (যেমন: 9.99 * 100 = 999)
    const unitAmount = Math.round(Number(plan.priceAmount) * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          // 💡 এটাই ম্যাজিক! Stripe-এর কোনো প্রাইস আইডি লাগবে না, অন-দ্য-ফ্লাই তৈরি হবে
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: unitAmount,
            // যদি রেকারিং সাবস্ক্রিপশন হয় (MONTHLY/YEARLY), তবে ইন্টারভাল পাস হবে
            ...(plan.billingInterval !== 'ONE_TIME' && {
              recurring: {
                interval: plan.billingInterval === 'YEARLY' ? 'year' : 'month',
              },
            }),
          },
          quantity: 1, 
        },
      ],
      mode: plan.billingInterval === 'ONE_TIME' ? 'payment' : 'subscription',
      customer_email: user.email,
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    });

    return session;
  }
}