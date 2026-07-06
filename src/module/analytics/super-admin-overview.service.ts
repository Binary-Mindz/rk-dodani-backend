import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SubscriptionStatus, UserRoleCode, InquiryType, InquiryStatus } from '@prisma/client';

@Injectable()
export class SuperAdminOverviewService {
  private readonly logger = new Logger(SuperAdminOverviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // --- 1. MRR (Monthly Recurring Revenue) ---
      const activeSubscriptions = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
      });

      let currentMRR = 0;
      for (const sub of activeSubscriptions) {
        if (!sub.plan) continue;
        const price = Number(sub.plan.priceAmount);
        if (sub.plan.billingInterval === 'MONTHLY') {
          currentMRR += price;
        } else if (sub.plan.billingInterval === 'YEARLY') {
          currentMRR += price / 12;
        }
      }

      const previousActiveSubscriptions = await this.prisma.subscription.findMany({
        where: {
          startedAt: { lte: thirtyDaysAgo },
          OR: [
            { endedAt: null },
            { endedAt: { gt: thirtyDaysAgo } },
          ],
        },
        include: {
          plan: true,
        },
      });

      let previousMRR = 0;
      for (const sub of previousActiveSubscriptions) {
        if (!sub.plan) continue;
        const price = Number(sub.plan.priceAmount);
        if (sub.plan.billingInterval === 'MONTHLY') {
          previousMRR += price;
        } else if (sub.plan.billingInterval === 'YEARLY') {
          previousMRR += price / 12;
        }
      }

      let mrrGrowth = 0;
      if (previousMRR > 0) {
        mrrGrowth = ((currentMRR - previousMRR) / previousMRR) * 100;
      } else if (currentMRR > 0) {
        mrrGrowth = 100;
      }

      // --- 2. Active Paid Users ---
      const activePaidUsersCount = await this.prisma.subscription.groupBy({
        by: ['userId'],
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: {
            priceAmount: { gt: 0 },
          },
        },
      });
      const currentActivePaidUsers = activePaidUsersCount.length;

      const previousPaidUsersCount = await this.prisma.subscription.groupBy({
        by: ['userId'],
        where: {
          startedAt: { lte: thirtyDaysAgo },
          OR: [
            { endedAt: null },
            { endedAt: { gt: thirtyDaysAgo } },
          ],
          plan: {
            priceAmount: { gt: 0 },
          },
        },
      });
      const previousActivePaidUsers = previousPaidUsersCount.length;

      let paidUsersGrowth = 0;
      if (previousActivePaidUsers > 0) {
        paidUsersGrowth = ((currentActivePaidUsers - previousActivePaidUsers) / previousActivePaidUsers) * 100;
      } else if (currentActivePaidUsers > 0) {
        paidUsersGrowth = 100;
      }

      // --- 3. Conversion Rate ---
      const totalUsersCount = await this.prisma.user.count({
        where: {
          NOT: {
            roles: {
              some: {
                role: { code: UserRoleCode.SUPER_ADMIN },
                isActive: true,
              },
            },
          },
          deletedAt: null,
        },
      });

      const currentConversionRate = totalUsersCount > 0 ? (currentActivePaidUsers / totalUsersCount) * 100 : 0;

      const previousTotalUsersCount = await this.prisma.user.count({
        where: {
          createdAt: { lte: thirtyDaysAgo },
          NOT: {
            roles: {
              some: {
                role: { code: UserRoleCode.SUPER_ADMIN },
                isActive: true,
              },
            },
          },
          OR: [
            { deletedAt: null },
            { deletedAt: { gt: thirtyDaysAgo } },
          ],
        },
      });

      const previousConversionRate = previousTotalUsersCount > 0 ? (previousActivePaidUsers / previousTotalUsersCount) * 100 : 0;

      let conversionRateGrowth = 0;
      if (previousConversionRate > 0) {
        conversionRateGrowth = ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100;
      } else if (currentConversionRate > 0) {
        conversionRateGrowth = 100;
      }

      // --- 4. Open Tickets ---
      const currentOpenTickets = await this.prisma.contactInquiry.count({
        where: {
          inquiryType: InquiryType.SUPPORT,
          status: {
            in: [InquiryStatus.NEW, InquiryStatus.REVIEWED, InquiryStatus.CONTACTED, InquiryStatus.QUALIFIED],
          },
        },
      });

      const previousOpenTickets = await this.prisma.contactInquiry.count({
        where: {
          inquiryType: InquiryType.SUPPORT,
          createdAt: { lte: thirtyDaysAgo },
          OR: [
            { closedAt: null },
            { closedAt: { gt: thirtyDaysAgo } },
          ],
          status: {
            in: [InquiryStatus.NEW, InquiryStatus.REVIEWED, InquiryStatus.CONTACTED, InquiryStatus.QUALIFIED],
          },
        },
      });

      let ticketsGrowth = 0;
      if (previousOpenTickets > 0) {
        ticketsGrowth = ((currentOpenTickets - previousOpenTickets) / previousOpenTickets) * 100;
      } else if (currentOpenTickets > 0) {
        ticketsGrowth = 100;
      }

      return {
        mrr: {
          value: currentMRR,
          growth: Math.round(mrrGrowth * 10) / 10,
        },
        activePaidUsers: {
          value: currentActivePaidUsers,
          growth: Math.round(paidUsersGrowth * 10) / 10,
        },
        conversionRate: {
          value: Math.round(currentConversionRate * 10) / 10,
          growth: Math.round(conversionRateGrowth * 10) / 10,
        },
        openTickets: {
          value: currentOpenTickets,
          growth: Math.round(ticketsGrowth * 10) / 10,
        },
      };
    } catch (error) {
      this.logger.error(`Error calculating super admin dashboard metrics: ${error.message}`);
      throw error;
    }
  }

  async getContentEngagement() {
    try {
      const topContent = await this.prisma.contentItem.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
        orderBy: [
          { downloadCount: 'desc' },
          { viewCount: 'desc' },
        ],
        take: 5,
        include: {
          contentType: true,
        },
      });

      return topContent.map((item) => {
        const viewCountNum = Number(item.viewCount);
        const downloadCountNum = Number(item.downloadCount);
        const code = item.contentType?.code;

        let engagementCount = viewCountNum;
        let actionLabel = 'Views';

        if (code === 'PODCAST') {
          actionLabel = 'Listens';
        } else if (item.isDownloadable && downloadCountNum > 0) {
          engagementCount = downloadCountNum;
          actionLabel = 'Downloads';
        }

        return {
          id: item.id,
          title: item.title,
          contentType: item.contentType?.name || 'Content',
          count: engagementCount,
          actionLabel,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching top content engagement: ${error.message}`);
      throw error;
    }
  }

  async getSubscriptionRetention() {
    try {
      const retentionData: any[] = [];
      const now = new Date();

      // Look at the last 6 completed calendar months
      for (let i = 6; i >= 1; i--) {
        const targetMonthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const targetMonthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

        // Find subscriptions that started in this target month
        const cohort = await this.prisma.subscription.findMany({
          where: {
            startedAt: {
              gte: targetMonthStart,
              lte: targetMonthEnd,
            },
          },
        });

        const totalCohort = cohort.length;
        let retainedCount = 0;

        if (totalCohort > 0) {
          // Check how many of these are active or trialing
          retainedCount = cohort.filter(
            (sub) => sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING,
          ).length;
        }

        const retentionRate = totalCohort > 0 ? (retainedCount / totalCohort) * 100 : 0;
        const monthName = targetMonthStart.toLocaleString('en-US', { month: 'short' });

        retentionData.push({
          month: monthName,
          value: Math.round(retentionRate),
          totalCohort,
          retainedCount,
        });
      }

      return retentionData;
    } catch (error) {
      this.logger.error(`Error calculating subscription retention: ${error.message}`);
      throw error;
    }
  }
}
