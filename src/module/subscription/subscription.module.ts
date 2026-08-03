import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AuditModule } from '../audit/audit.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, AuditModule, ChatModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
