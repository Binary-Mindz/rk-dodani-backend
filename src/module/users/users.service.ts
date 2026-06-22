import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    // ⚡ ১. একই কুয়েরিতে রোল, সাবস্ক্রিপশন এবং প্ল্যানের ডেটা ইনক্লুড করা হয়েছে
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
        // ইউজারটির লেটেস্ট অ্যাক্টিভ অথবা ট্রায়াল সাবস্ক্রিপশনটি বের করার জন্য
        subscriptions: {
          where: {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
            },
          },
          orderBy: {
            createdAt: 'desc', // কোনো কারণে একাধিক থাকলে লেটেস্টটি আগে আসবে
          },
          take: 1,
          include: {
            plan: true, // প্ল্যানের নাম, কোড, প্রোভাইডার, ইন্টারভাল জানার জন্য
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ⚡ ২. অ্যাক্টিভ সাবস্ক্রিপশন এবং প্ল্যান অবজেক্ট এক্সট্র্যাক্ট করা
    const activeSubscription = user.subscriptions[0] || null;
    const activePlan = activeSubscription?.plan || null;

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((item) => item.role.code),
      
      purchaseInfo: activeSubscription
        ? {
            subscriptionId: activeSubscription.id,
            status: activeSubscription.status,
            currentPeriodStart: activeSubscription.currentPeriodStart,
            currentPeriodEnd: activeSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            provider: activeSubscription.provider, // e.g., STRIPE, PATREON
            plan: {
              id: activePlan?.id || null,
              code: activePlan?.code || null,         // e.g., 'STUDENT_PRO', 'ENTERPRISE_TEAM'
              name: activePlan?.name || null,         // e.g., 'Pro Student Plan'
              targetAudience: activePlan?.targetAudience || null, // B2C or B2B
              billingInterval: activePlan?.billingInterval || null, 
              currency: activePlan?.currency || null,
              priceAmount: activePlan?.priceAmount ? Number(activePlan.priceAmount) : 0, 
            },
          }
        : null, 

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}