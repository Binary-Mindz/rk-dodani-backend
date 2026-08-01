import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from 'common/mail/mail.module';

@Module({
  imports: [ConfigModule, AuditModule, MailModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
