import { Module } from '@nestjs/common';
import { ServiceSubmissionController } from './service-submission.controller';
import { ServiceSubmissionService } from './service-submission.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ServiceSubmissionController],
  providers: [ServiceSubmissionService],
  exports: [ServiceSubmissionService],
})
export class ServiceSubmissionModule {}
