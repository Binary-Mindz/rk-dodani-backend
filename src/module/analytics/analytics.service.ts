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

      const teamInfluence = 'Top 5%';

      return {
        completionRate: `${completionRate}%`,
        timeSpent: `${timeSpentHours}h`,
        resourceReach: `${resourcesAccessed}/${totalAvailableResources || 25}`,
        teamInfluence,
      };
    } catch (error) {
      this.logger.error(`Error calculating usage summary: ${error.message}`);
      throw error;
    }
  }

  async getConsumptionPatterns(userId: string, period: string) {
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
      value: dayTotals[day] || 0, // No more random data, strictly 0 if no data
    }));

    return data;
  }
}
