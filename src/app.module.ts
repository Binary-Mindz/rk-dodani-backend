import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from 'module/health/health.module';
import { RolesModule } from 'module/roles/roles.module';
import { AuthModule } from 'module/auth/auth.module';
import { UsersModule } from 'module/users/users.module';
import { MailModule } from 'common/mail/mail.module';
import { ContentMasterModule } from 'module/content-master/content-master.module';
import { ContactInquiryModule } from 'module/contact-inquiry/contact-inquiry.module';
import { ContentModule } from 'module/content/content.module';
import { ContentAccessModule } from 'module/content-access/content-access.module';
import { ContentAssetModule } from 'module/content-asset/content-asset.module';
import { PageModule } from 'module/page/page.module';
import { ServiceModule } from 'module/service/service.module';
import { BillingModule } from 'module/billing/billing.module';
import { WebhookModule } from 'module/webhook/webhook.module';
import { PlanModule } from 'module/plan/plan.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    RolesModule,
    MailModule,
    AuthModule,
    UsersModule,
    ContentModule,
    ContentAccessModule,
    ContentMasterModule,
    ContactInquiryModule,
    ContentAssetModule,
    PageModule,
    ServiceModule,
    PlanModule,
    BillingModule,
    WebhookModule
  ],
})
export class AppModule {}
