import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { AccountSettingsController } from './account-settings.controller';
import { TeamDashboardController } from './team-dashboard.controller';
import { UsageEngagementController } from './usage-engagement.controller';
import { TeamOnboardingController } from './team-onboarding.controller';

@Module({
  controllers: [
    AccountSettingsController,
    TeamDashboardController,
    UsageEngagementController,
    TeamOnboardingController,
  ],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
