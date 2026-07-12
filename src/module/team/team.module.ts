import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { AccountSettingsController } from './account-settings.controller';
import { TeamDashboardController } from './team-dashboard.controller';
import { UsageEngagementController } from './usage-engagement.controller';
import { TeamOnboardingController } from './team-onboarding.controller';
import { TeamTestController } from './team-test.controller';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [
    AccountSettingsController,
    TeamDashboardController,
    UsageEngagementController,
    TeamOnboardingController,
    TeamTestController
  ],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
