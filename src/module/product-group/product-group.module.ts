import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';

@Module({
  imports: [AuditModule],
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
  exports: [ProductGroupService],
})
export class ProductGroupModule {}
