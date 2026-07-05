import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUsageSummary(userId: string) {
    try {
      const allProgress = await this.prisma.userContentProgress.findMany({
        where: { userId },
      });
      
      let completionRate = 0;
      if (allProgress.length > 0) {
        const completedCount = allProgress.filter((p) => p.status === 'COMPLETED').length;
        completionRate = Math.round((completedCount / allProgress.length) * 100);
      }

      const totalTimeSpentSec = allProgress.reduce((acc, curr) => acc + curr.totalTimeSpentSec, 0);
      const timeSpentHours = (totalTimeSpentSec / 3600).toFixed(1);

      const totalAvailableResources = await this.prisma.contentItem.count({
        where: { visibility: 'PUBLIC' },
      });
      const resourcesAccessed = allProgress.length;

      // Calculate dynamic Team Influence (Top X%) based on total time spent compared to others
      let teamInfluence = 'Top 100%';
      if (totalTimeSpentSec > 0) {
        // Group by user to find total time spent by each user
        const allUsersProgress = await this.prisma.userContentProgress.groupBy({
          by: ['userId'],
          _sum: {
            totalTimeSpentSec: true,
          },
        });

        const totalUsers = allUsersProgress.length;
        if (totalUsers > 1) {
          const usersWithLessTime = allUsersProgress.filter(
            (u) => (u._sum.totalTimeSpentSec || 0) < totalTimeSpentSec,
          ).length;

          // Calculate percentile (0 to 100)
          const percentile = (usersWithLessTime / totalUsers) * 100;
          // E.g., if you beat 90% of people, you are Top 10%
          const topPercent = Math.max(1, Math.round(100 - percentile)); 
          teamInfluence = `Top ${topPercent}%`;
        } else {
          // If they are the only user with data
          teamInfluence = 'Top 1%';
        }
      }

      return {
        completionRate: `${completionRate}%`,
        timeSpent: `${timeSpentHours}h`,
        resourceReach: `${resourcesAccessed}/${totalAvailableResources || 1}`,
        teamInfluence,
      };
    } catch (error) {
      this.logger.error(`Error calculating usage summary: ${error.message}`);
      throw error;
    }
  }

  async getConsumptionPatterns(userId: string) {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); 
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    const logs = await this.prisma.userActivityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    const dayTotals = logs.reduce((acc, log) => {
      const day = log.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + log.durationSec;
      return acc;
    }, {} as Record<string, number>);

    const data = days.map((day) => ({
      day,
      value: dayTotals[day] || 0,
    }));

    return data;
  }
}
