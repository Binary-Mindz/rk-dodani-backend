import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SuperAdminOverviewController } from './super-admin-overview.controller';
import { SuperAdminOverviewService } from './super-admin-overview.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, SuperAdminOverviewController],
  providers: [AnalyticsService, SuperAdminOverviewService],
  exports: [AnalyticsService, SuperAdminOverviewService],
})
export class AnalyticsModule {}
