import { Module } from '@nestjs/common';
import { ProductSubmissionController } from './product-submission.controller';
import { ProductSubmissionService } from './product-submission.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProductSubmissionController],
  providers: [ProductSubmissionService],
  exports: [ProductSubmissionService],
})
export class ProductSubmissionModule {}
