import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from 'module/health/health.module';
import { AuthModule } from 'module/auth/auth.module';
import { UsersModule } from 'module/users/users.module';
import { MailModule } from 'common/mail/mail.module';
import { ContentMasterModule } from 'module/content-master/content-master.module';
import { ContentModule } from 'module/content/content.module';
import { ContentAccessModule } from 'module/content-access/content-access.module';
import { ServiceModule } from 'module/service/service.module';
import { PlanModule } from 'module/plan/plan.module';
import { AppSettingModule } from 'module/app-setting/app-setting.module';
import { AuditModule } from 'module/audit/audit.module';
import { AppController } from 'app.controller';
import { PatreonModule } from './module/patreon/patreon.module';
import { SubscriptionModule } from './module/subscription/subscription.module';
import { FileModule } from './module/file/file.module';
import { UserManagementModule } from './module/user-management/user-management.module';
import { TicketsModule } from './module/ticket/tickets.module';
import { ChatModule } from './module/chat/chat.module';
import { NotificationModule } from './module/notification/notification.module';
import { AnalyticsModule } from './module/analytics/analytics.module';
import { TeamModule } from './module/team/team.module';
import { AlertController } from './module/alert/alert.controller';
import { AlertService } from './module/alert/alert.service';
import { AlertModule } from './module/alert/alert.module';
import { ProductModule } from './module/product/product.module';
import { InsightModule } from './module/insight/insight.module';
import { ServiceGroupModule } from './module/service-group/service-group.module';
import { ProductGroupModule } from './module/product-group/product-group.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    HealthModule,
    MailModule,
    FileModule,
    AuthModule,
    UsersModule,
    UserManagementModule,
    SubscriptionModule,
    ContentMasterModule,
    ContentModule,
    ContentAccessModule,
    ServiceModule,
    PlanModule,
    TicketsModule,
    AppSettingModule,
    AuditModule,
    PatreonModule,
    MailModule,
    ChatModule,
    NotificationModule,
    AnalyticsModule,
    TeamModule,
    AlertModule,
    ProductModule,
    InsightModule,
    ServiceGroupModule,
    ProductGroupModule,
  ],
  controllers: [AppController, AlertController],
  providers: [AlertService],
})
export class AppModule {}
