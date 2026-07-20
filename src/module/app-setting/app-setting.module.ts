import { Module } from '@nestjs/common';
import { AppSettingController } from './app-setting.controller';
import { AppSettingService } from './app-setting.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AppSettingController],
  providers: [AppSettingService],
  exports: [AppSettingService],
})
export class AppSettingModule {}
