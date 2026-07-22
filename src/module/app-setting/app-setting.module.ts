import { Module } from '@nestjs/common';
import { AppSettingController, AppSettingPublicController } from './app-setting.controller';
import { AppSettingService } from './app-setting.service';
import { AuditModule } from '../audit/audit.module';
import { AlertModule } from '../alert/alert.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from 'common/mail/mail.module';

@Module({
  imports: [AuditModule, AlertModule, NotificationModule, MailModule],
  controllers: [AppSettingController, AppSettingPublicController],
  providers: [AppSettingService],
  exports: [AppSettingService],
})
export class AppSettingModule {}
