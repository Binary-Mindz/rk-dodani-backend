import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InsightCategoryController } from './insight-category.controller';
import { InsightCategoryService } from './insight-category.service';

@Module({
  imports: [AuditModule],
  controllers: [InsightCategoryController],
  providers: [InsightCategoryService],
  exports: [InsightCategoryService],
})
export class InsightCategoryModule {}
